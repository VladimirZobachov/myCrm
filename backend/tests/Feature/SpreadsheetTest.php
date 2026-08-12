<?php

namespace Tests\Feature;

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use Tests\TestCase;

class SpreadsheetTest extends TestCase
{
    public function test_phpspreadsheet_class_is_autoloaded(): void
    {
        $this->assertTrue(class_exists(Spreadsheet::class));
    }

    public function test_it_writes_and_reads_back_a_spreadsheet_with_two_rows(): void
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->setCellValue('A1', 'Name');
        $sheet->setCellValue('B1', 'Email');
        $sheet->setCellValue('A2', 'Ivan Petrov');
        $sheet->setCellValue('B2', 'ivan@example.com');

        // Xls (BIFF8) is used instead of Xlsx because Xlsx requires ext-zip,
        // which is not installed in the CI PHP image; Xls needs no extra extensions.
        $path = tempnam(sys_get_temp_dir(), 'phpspreadsheet_test_') . '.xls';

        $writer = IOFactory::createWriter($spreadsheet, 'Xls');
        $writer->save($path);

        $this->assertFileExists($path);
        $this->assertGreaterThan(0, filesize($path));

        $reader = IOFactory::createReader('Xls');
        $loaded = $reader->load($path);
        $loadedSheet = $loaded->getActiveSheet();

        $this->assertSame('Name', $loadedSheet->getCell('A1')->getValue());
        $this->assertSame('Email', $loadedSheet->getCell('B1')->getValue());
        $this->assertSame('Ivan Petrov', $loadedSheet->getCell('A2')->getValue());
        $this->assertSame('ivan@example.com', $loadedSheet->getCell('B2')->getValue());

        unlink($path);
    }
}
