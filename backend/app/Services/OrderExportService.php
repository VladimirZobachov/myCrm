<?php

namespace App\Services;

use App\Models\Order;
use App\Models\User;
use App\Services\Export\OrderExportConfig;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * Перенос legacy-экспорта заявок в Excel: index.php::export() +
 * includes/db.class.php::getOrdersForExport() + includes/PHPExcel/writer.php::XLSWriter.
 *
 * Xls (BIFF8), не Xlsx — на сервере нет ext-zip (см. tests/Feature/SpreadsheetTest.php).
 */
class OrderExportService
{
    /** Легаси-палитра заливки строк-разделителей групп (writer.php::$colors). */
    private const GROUP_COLORS = ['00b0f0', '00b050', 'faff00', 'ffc000', 'da9694', 'b1a0c7', '31869b', '92d050'];

    /** Ширины колонок из writer.php::setCellsWitdth() (буква => ширина в ед. Excel). */
    private const COLUMN_WIDTHS = [
        'A' => 22.7,
        'B' => 106.353,
        'C' => 17.334,
        'D' => 16.1595,
        'E' => 20.331,
        'F' => 24.3405,
        'G' => 17.658,
        'H' => 17.658,
    ];

    public function exportAdminDetailed(?string $sdate = null, ?string $edate = null): string
    {
        return $this->export([...OrderExportConfig::adminDetailed(), 'sdate' => $sdate, 'edate' => $edate]);
    }

    public function exportAdminSummary(?string $sdate = null, ?string $edate = null): string
    {
        return $this->export([...OrderExportConfig::adminSummary(), 'sdate' => $sdate, 'edate' => $edate]);
    }

    public function exportMounter(User $mounter, ?string $sdate = null, ?string $edate = null): string
    {
        return $this->export([...OrderExportConfig::mounter(), 'user' => $mounter, 'sdate' => $sdate, 'edate' => $edate]);
    }

    /**
     * Генерирует XLS-файл по конфигу (headers/sum/group_by, см. OrderExportConfig)
     * и возвращает путь к временному файлу.
     *
     * @param array{
     *   headers: array<int, array{0: string, 1: ?string, 2: string}>,
     *   sum: ?array{0: string, 1: string},
     *   group_by: string,
     *   user?: ?User,
     *   sdate?: ?string,
     *   edate?: ?string,
     * } $config
     */
    public function export(array $config): string
    {
        $headers = $config['headers'];
        $sum = $config['sum'] ?? null;

        $groupedRows = $this->fetchGrouped(
            $config['user'] ?? null,
            $config['sdate'] ?? null,
            $config['edate'] ?? null,
            $config['group_by'],
        );

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        foreach ($headers as $h) {
            $sheet->setCellValue($h[2] . '1', $h[0]);
        }

        $lastColumn = $headers[count($headers) - 1][2];
        $rowIndex = 2;
        $groupNum = 1;
        $colorIndex = 0;
        $sumTotal = 0.0;

        foreach ($groupedRows as $groupLabel => $rows) {
            $this->writeGroupHeader(
                $sheet,
                (string) $groupLabel,
                $groupNum,
                $rowIndex,
                $lastColumn,
                self::GROUP_COLORS[$colorIndex % count(self::GROUP_COLORS)],
            );
            $colorIndex++;
            $rowIndex++;

            foreach ($rows as $row) {
                foreach ($headers as [$label, $field, $column]) {
                    $sheet->setCellValue($column . $rowIndex, $field === null ? ' ' : $this->resolveValue($field, $row));
                }

                if ($sum !== null) {
                    $sumTotal += $this->resolveSum($sum[0], $row);
                }

                $rowIndex++;
            }

            $groupNum++;
        }

        if ($sum !== null) {
            $sheet->setCellValue($sum[1] . $rowIndex, $sumTotal);
            $sheet->getStyle("A{$rowIndex}:{$lastColumn}{$rowIndex}")->getFont()->setBold(true);
        }

        $this->applyColumnWidths($sheet, $headers);

        $path = tempnam(sys_get_temp_dir(), 'order_export_') . '.xls';
        $writer = IOFactory::createWriter($spreadsheet, 'Xls');
        $writer->save($path);

        return $path;
    }

    /**
     * Заявки (status=3, is_archived=0), сгруппированные по ТРЦ (с "Прочее" для
     * произвольного trc_other) или по fio создателя — перенос getOrdersForExport().
     *
     * @return array<string, array<int, array<string, mixed>>>
     */
    protected function fetchGrouped(?User $forUser, ?string $sdate, ?string $edate, string $groupBy): array
    {
        $query = Order::query()
            ->with('createdBy:id,fio')
            ->where('is_archived', 0)
            ->where('status', 3);

        if ($forUser) {
            $query->where('created_for', $forUser->id);
        }
        if ($sdate) {
            $query->where('date', '>=', $sdate);
        }
        if ($edate) {
            $query->where('date', '<=', $edate);
        }

        $orders = $query->orderBy('trc')->get();

        $grouped = [];
        foreach ($orders as $order) {
            $row = $order->toArray();
            $row['fio'] = $order->createdBy?->fio ?? '';
            // SQL: IF(orders.trc='Другое', orders.trc_other, orders.trc) AS _trc
            $row['_trc'] = $order->trc === 'Другое' ? $order->trc_other : $order->trc;

            $key = $groupBy === OrderExportConfig::GROUP_BY_FIO
                ? $row['fio']
                : ($order->trc_other ? 'Прочее' : $order->trc);

            $grouped[$key][] = $row;
        }

        return $grouped;
    }

    private function writeGroupHeader(Worksheet $sheet, string $label, int $groupNum, int $rowIndex, string $lastColumn, string $color): void
    {
        $range = "A{$rowIndex}:{$lastColumn}{$rowIndex}";
        $sheet->getStyle($range)->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB($color);
        $sheet->getStyle("A{$rowIndex}")->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->setCellValue("A{$rowIndex}", $groupNum);
        $sheet->setCellValue("B{$rowIndex}", $label);

        foreach (range('C', $lastColumn) as $col) {
            $sheet->setCellValue("{$col}{$rowIndex}", '');
        }
    }

    private function resolveValue(string $field, array $row): mixed
    {
        if (str_contains($field, ' ')) {
            return $this->evaluateExpression($field, $row);
        }

        return $row[$field] ?? '';
    }

    /**
     * price/price_admin — VARCHAR(100), legacy хранит там и нечисловые значения
     * ("По факту", "-"), поэтому явный floatval() обязателен: PHP 8 бросает TypeError
     * на арифметике над нечисловыми строками (в отличие от legacy на старом PHP).
     */
    private function resolveSum(string $fieldOrExpr, array $row): float
    {
        if (str_contains($fieldOrExpr, ' ')) {
            return $this->evaluateExpression($fieldOrExpr, $row);
        }

        return (float) floatval($row[$fieldOrExpr] ?? 0);
    }

    private function evaluateExpression(string $expr, array $row): float
    {
        [$left, $op, $right] = explode(' ', $expr);
        $leftVal = floatval($row[$left] ?? 0);
        $rightVal = floatval($row[$right] ?? 0);

        return $op === '+' ? $leftVal + $rightVal : $leftVal - $rightVal;
    }

    private function applyColumnWidths(Worksheet $sheet, array $headers): void
    {
        foreach ($headers as $h) {
            $col = $h[2];
            if (isset(self::COLUMN_WIDTHS[$col])) {
                $sheet->getColumnDimension($col)->setWidth(self::COLUMN_WIDTHS[$col]);
            }
        }
    }
}
