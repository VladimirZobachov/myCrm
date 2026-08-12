<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use App\Services\OrderExportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Tests\TestCase;

class OrderExportTest extends TestCase
{
    use RefreshDatabase;

    protected function makeUser(int $type, string $fio = ''): User
    {
        return User::create([
            'login' => 'user' . $type . uniqid(),
            'email' => 'user' . $type . uniqid() . '@test.local',
            'fio' => $fio,
            'passwd' => Hash::make('secret'),
            'type_user' => $type,
        ]);
    }

    protected function makeOrder(array $overrides = []): Order
    {
        return Order::create(array_merge([
            'date_create' => now(),
            'date' => '2026-08-11',
            'trc' => 'Гринвич',
            'trc_other' => null,
            'type_work' => 'Монтаж баннера',
            'brand' => 'Тест',
            'where_print' => 'Дельта Принт',
            'where_other' => null,
            'photo' => 'photo.jpg',
            'price' => '1000',
            'price_admin' => '700',
            'importance' => 'ТЕКУЩАЯ в течении 48 часов',
            'importance_other' => '',
            'comments' => null,
            'comment_manager' => '',
            'status' => 3,
            'is_archived' => 0,
        ], $overrides));
    }

    public function test_export_admin_detailed_creates_valid_xls_file(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id]);

        $path = (new OrderExportService())->exportAdminDetailed();

        $this->assertFileExists($path);
        $this->assertGreaterThan(0, filesize($path));

        $reader = IOFactory::createReader('Xls');
        $loaded = $reader->load($path);
        $this->assertNotNull($loaded->getActiveSheet());

        unlink($path);
    }

    public function test_admin_detailed_headers_match_legacy(): void
    {
        $path = (new OrderExportService())->exportAdminDetailed();

        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $expected = [
            'A1' => '№',
            'B1' => 'Наименование работ и место производства',
            'C1' => 'Дата',
            'D1' => 'Фонд оплаты рабочих',
            'E1' => 'Оплата на ИнЦентр',
            'F1' => ' ',
            'G1' => 'сумма менеджеры',
            'H1' => 'доход',
        ];
        foreach ($expected as $cell => $value) {
            $this->assertSame($value, $sheet->getCell($cell)->getValue(), "Cell {$cell}");
        }

        unlink($path);
    }

    public function test_mounter_headers_match_legacy(): void
    {
        $mounter = $this->makeUser(3, 'Петров Пётр');
        $path = (new OrderExportService())->exportMounter($mounter);

        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $expected = [
            'A1' => '№ заказа',
            'B1' => 'Дата монтажа',
            'C1' => 'Вид работ',
            'D1' => 'Фотопривязка',
            'E1' => 'Стоимость',
        ];
        foreach ($expected as $cell => $value) {
            $this->assertSame($value, $sheet->getCell($cell)->getValue(), "Cell {$cell}");
        }

        unlink($path);
    }

    public function test_admin_summary_headers_match_legacy(): void
    {
        $path = (new OrderExportService())->exportAdminSummary();

        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $expected = [
            'A1' => '№ заказа',
            'B1' => 'Дата монтажа',
            'C1' => 'ТРЦ',
            'D1' => 'Вид работ',
            'E1' => 'Фотопривязка',
            'F1' => 'Стоимость мен.',
            'G1' => 'Стоимость',
            'H1' => 'Сумма',
        ];
        foreach ($expected as $cell => $value) {
            $this->assertSame($value, $sheet->getCell($cell)->getValue(), "Cell {$cell}");
        }

        unlink($path);
    }

    public function test_mounter_sees_only_own_assigned_orders(): void
    {
        $mounter = $this->makeUser(3, 'Петров Пётр');
        $otherMounter = $this->makeUser(3, 'Сидоров Сидор');

        $ownOrder = $this->makeOrder(['created_for' => $mounter->id, 'trc' => 'Метрополис']);
        $this->makeOrder(['created_for' => $otherMounter->id, 'trc' => 'Гринвич']);

        $path = (new OrderExportService())->exportMounter($mounter);
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $ids = [];
        for ($row = 2; $row <= $sheet->getHighestRow(); $row++) {
            $value = $sheet->getCell('A' . $row)->getValue();
            if (is_numeric($value)) {
                $ids[] = (int) $value;
            }
        }

        $this->assertContains($ownOrder->id, $ids);
        unlink($path);
    }

    public function test_only_completed_non_archived_orders_are_exported(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id, 'status' => 3, 'is_archived' => 0, 'trc' => 'Видно']);
        $this->makeOrder(['created_by' => $manager->id, 'status' => 1, 'is_archived' => 0, 'trc' => 'НеВидноСтатус']);
        $this->makeOrder(['created_by' => $manager->id, 'status' => 3, 'is_archived' => 1, 'trc' => 'НеВидноАрхив']);

        $path = (new OrderExportService())->exportAdminDetailed();
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $cellValues = [];
        for ($row = 2; $row <= $sheet->getHighestRow(); $row++) {
            $cellValues[] = $sheet->getCell('B' . $row)->getValue();
        }

        $this->assertContains('Видно', $cellValues);
        $this->assertNotContains('НеВидноСтатус', $cellValues);
        $this->assertNotContains('НеВидноАрхив', $cellValues);

        unlink($path);
    }

    public function test_date_filter_excludes_orders_outside_range(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id, 'date' => '2026-01-10', 'trc' => 'Январь']);
        $this->makeOrder(['created_by' => $manager->id, 'date' => '2026-08-05', 'trc' => 'Август']);

        $path = (new OrderExportService())->exportAdminDetailed('2026-08-01', '2026-08-31');
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $cellValues = [];
        for ($row = 2; $row <= $sheet->getHighestRow(); $row++) {
            $cellValues[] = $sheet->getCell('B' . $row)->getValue();
        }

        $this->assertContains('Август', $cellValues);
        $this->assertNotContains('Январь', $cellValues);

        unlink($path);
    }

    public function test_admin_summary_groups_by_creator_fio_and_sums_price_minus_price_admin(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id, 'price' => '1000', 'price_admin' => '700']);
        $this->makeOrder(['created_by' => $manager->id, 'price' => '2000', 'price_admin' => '1500']);

        $path = (new OrderExportService())->exportAdminSummary();
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $lastRow = $sheet->getHighestRow();
        $total = (float) $sheet->getCell('H' . $lastRow)->getValue();

        // (1000 - 700) + (2000 - 1500) = 800
        $this->assertEqualsWithDelta(800.0, $total, 0.001);

        $groupLabels = [];
        for ($row = 2; $row <= $lastRow; $row++) {
            $value = $sheet->getCell('B' . $row)->getValue();
            if ($value === $manager->fio) {
                $groupLabels[] = $value;
            }
        }
        $this->assertNotEmpty($groupLabels);

        unlink($path);
    }

    public function test_admin_detailed_income_columns_are_left_blank_for_manual_entry(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id]);

        $path = (new OrderExportService())->exportAdminDetailed();
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        // Первая строка данных находится после строки-разделителя группы (row 2 = group header).
        $dataRow = 3;
        $this->assertSame(' ', $sheet->getCell('F' . $dataRow)->getValue());
        $this->assertSame(' ', $sheet->getCell('G' . $dataRow)->getValue());
        $this->assertSame(' ', $sheet->getCell('H' . $dataRow)->getValue());

        unlink($path);
    }

    public function test_trc_group_header_rows_are_colored_with_cycling_legacy_palette(): void
    {
        // Легаси-палитра writer.php::$colors (8 цветов, циклично по группам).
        $expectedPalette = ['00B0F0', '00B050', 'FAFF00', 'FFC000', 'DA9694', 'B1A0C7', '31869B', '92D050'];

        $manager = $this->makeUser(2, 'Иванов Иван');
        $groupCount = 9; // > 8, чтобы проверить цикличность палитры (9-я группа = цвет 1-й)
        for ($i = 1; $i <= $groupCount; $i++) {
            $this->makeOrder(['created_by' => $manager->id, 'trc' => sprintf('Группа%02d', $i)]);
        }

        $path = (new OrderExportService())->exportAdminDetailed();
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        // По одной заявке на группу => заголовок группы в строке 2 + i*2 (0-индексация групп).
        $actualColors = [];
        for ($i = 0; $i < $groupCount; $i++) {
            $headerRow = 2 + $i * 2;
            $fill = $sheet->getStyle('A' . $headerRow)->getFill();
            $this->assertSame(Fill::FILL_SOLID, $fill->getFillType(), "Row {$headerRow} fill type");
            $actualColors[] = $fill->getStartColor()->getRGB();
        }

        foreach ($actualColors as $i => $rgb) {
            $this->assertSame($expectedPalette[$i % 8], $rgb, "Color for group #" . ($i + 1));
        }

        // Разные группы ТРЦ (в пределах первых 8) должны иметь разные цвета.
        $this->assertSame(8, count(array_unique(array_slice($actualColors, 0, 8))));
        // 9-я группа переиспользует цвет 1-й (цикличность).
        $this->assertSame($actualColors[0], $actualColors[8]);

        unlink($path);
    }

    public function test_admin_summary_total_row_exists_bold_with_correct_sum(): void
    {
        $manager = $this->makeUser(2, 'Иванов Иван');
        $this->makeOrder(['created_by' => $manager->id, 'price' => '1000', 'price_admin' => '700']);
        $this->makeOrder(['created_by' => $manager->id, 'price' => '2000', 'price_admin' => '1500']);

        $path = (new OrderExportService())->exportAdminSummary();
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $lastRow = $sheet->getHighestRow();

        // (1000 - 700) + (2000 - 1500) = 800, записано в колонку H итоговой строки.
        $this->assertEqualsWithDelta(800.0, (float) $sheet->getCell('H' . $lastRow)->getValue(), 0.001);

        $this->assertTrue(
            $sheet->getStyle('H' . $lastRow)->getFont()->getBold(),
            'Total row must be bold, matching legacy visual for summary footer',
        );
        $this->assertTrue($sheet->getStyle('A' . $lastRow)->getFont()->getBold());

        unlink($path);
    }

    public function test_mounter_summary_total_row_sums_price_admin_column(): void
    {
        $mounter = $this->makeUser(3, 'Петров Пётр');
        $this->makeOrder(['created_for' => $mounter->id, 'price_admin' => '500']);
        $this->makeOrder(['created_for' => $mounter->id, 'price_admin' => '300']);

        $path = (new OrderExportService())->exportMounter($mounter);
        $sheet = IOFactory::createReader('Xls')->load($path)->getActiveSheet();

        $lastRow = $sheet->getHighestRow();
        $this->assertEqualsWithDelta(800.0, (float) $sheet->getCell('E' . $lastRow)->getValue(), 0.001);
        $this->assertTrue($sheet->getStyle('E' . $lastRow)->getFont()->getBold());

        unlink($path);
    }
}
