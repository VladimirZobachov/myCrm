<?php


include_once( "Classes/PHPExcel.php" );

class XLSWriter
{

    var $header_data = array(
        "№",
        "Наименование работ и место производства",
        "Дата",
        "Фонд оплаты рабочих",
        "Оплата на ИнЦентр",
        " ",
        "сумма менеджеры",
        "доход"
    );
    var $symbols = array("A", "B", "C", "D", "E", "F", "G", "H");
    var $colors = array("00b0f0", "00b050", "faff00", "ffc000", "da9694", "b1a0c7", "31869b", "92d050");
    
    
    function __construct($h)
    {
        $this->header_data = $h;
    }


    function writeTrc( $val, $writer, $index, $trc_num )
    {
        $w = $writer->setActiveSheetIndex(0);
        $color = $this->colors[rand(0, count($this->colors) - 1)];
        $this->cellColor( "A". $index . ":H". $index, $color, $writer );
        $this->setAlignment( "A". $index, "center", $writer );
        foreach( $this->symbols as $k=>$v )
        {
            if( $k == 0 )
            {
                $w->setCellValue( $v . $index, $trc_num );
            }elseif( $k == 1 )
            {
                $w->setCellValue( $v . $index, $val );
            }else
            {   
                $w->setCellValue( $v . $index, "" );
            }
        }
        $index += 1;
        $w = $writer->setActiveSheetIndex(0);
        $this->cellColor( "A". $index, "ff0000", $writer );
    }
    
    
    function cellColor( $cells, $color, $writer){

        $writer->getActiveSheet()->getStyle($cells)->getFill()->applyFromArray(array(
            'type' => PHPExcel_Style_Fill::FILL_SOLID,
            'startcolor' => array(
                'rgb' => $color
            ),
        ));
    }
    
    
    function setAlignment( $cells, $align, $writer )
    {
        if( $align == "center" )
        {
            $align = PHPExcel_Style_Alignment::HORIZONTAL_CENTER;
        }elseif( $align == "left" )
        {
            $align = PHPExcel_Style_Alignment::HORIZONTAL_LEFT;
        }elseif( $align = "right" )
        {
            $align = PHPExcel_Style_Alignment::HORIZONTAL_RIGHT;
        }
        $writer->getActiveSheet()->getStyle($cells)->getAlignment()->setHorizontal($align);
    }
    
    
    function setCellsWitdth( $writer, $count=0 )
    {
        $coef = 4.05;
        $widths = array(
            "A" => 22.7,
            "B" => 26.26 * $coef,
            "C" => 4.28 * $coef,
            "D" => 3.99 * $coef,
            "E" => 5.02 * $coef, 
            "F" => 6.01 * $coef,
            "G" => 4.36 * $coef,
            "H" => 4.36 * $coef
        );
        if( !$count ) $count = count($widths);
        $i = 0;
        foreach( $widths as $k=>$w )
        {
            $writer->getActiveSheet()->getColumnDimension($k)->setWidth($w);
            $i++;
        }
//         $writer->getActiveSheet()->getColumnDimension("B")->setWidth(26.26 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("C")->setWidth(4.28 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("D")->setWidth(3.99 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("E")->setWidth(5.02 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("F")->setWidth(6.01 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("G")->setWidth(4.36 * $coef);
//         $writer->getActiveSheet()->getColumnDimension("H")->setWidth(4.36 * $coef);
    }


    function write( $data, $sum_price=null )
    {
        $writer = new PHPExcel;
        $count = count($this->header_data);
        $this->setCellsWitdth( $writer, $count );
        $w = $writer->setActiveSheetIndex(0);
        foreach( $this->header_data as $v ) $w->setCellValue( $v[2] ."1", $v[0] );
        $index = 2;
        $trc_num = 1;
        $price_sum = 0;
        if( $sum_price && strpos($sum_price[0], " ") !== false )
        {
            $sum_price[0] = explode(" ", $sum_price[0]);
        }
        foreach( $data as $trc=>$rows )
        {
            $this->writeTrc( $trc, $writer, $index, $trc_num );
            $index += 2;
//             $w->setCellValue( "A". $index, $trc_num );
            foreach( $rows as $row )
            {
                $w = $writer->setActiveSheetIndex(0);
                foreach( $this->header_data as $h )
                {
                    if( strpos($h[1], ' ') !== false )
                    {
                        $h[1] = explode(" ", $h[1]);
                        $t = $h[1][1] == "+" ? true : false;
                        if( $t )
                        {
                            $val = floatval($row[$h[1][0]]) + floatval($row[$h[1][2]]);
                        }else
                        {
                            $val = floatval($row[$h[1][0]]) - floatval($row[$h[1][2]]);
                        }
                    }elseif( strpos($row[$h[1]], " or ") !== false )
                    {
                        $variants = explode(" or ", $row[$h[1]]);
                        $val = $row[$variants[0]] ? $row[$variants[0]] : $row[$variants[1]];
                    }else{
                        $val = $row[$h[1]];
                    }
                    $w->setCellValue( $h[2] . $index, $h[1] ? $val : " " );
                }
                if( $sum_price )
                {
                    if( is_array($sum_price[0]) )
                    {
                        if( $sum_price[1] == "+" )
                        {
                            $price_sum += $row[$sum_price[0][0]] + $row[$sum_price[0][2]];
                        }else
                        {
                            $price_sum += $row[$sum_price[0][0]] - $row[$sum_price[0][2]];
                        }
                    }else
                    {
                        $price_sum += $row[$sum_price[0]];
                    }
                }
//                 $w->setCellValue( "B". $index, $row['type_work'] );
//                 $w->setCellValue( "C". $index, $row['date'] );
//                 $w->setCellValue( "D". $index, $row['price'] );
//                 $w->setCellValue( "E". $index, $row['fio'] );
                $index += 1;
            }
            $trc_num += 1;
        }
        if( $sum_price )
        {
            $w = $writer->setActiveSheetIndex(0);
            $w->setCellValue( $sum_price[1] . $index, $price_sum );
        }
        header('Content-Type: application/vnd.ms-excel');
        header('Content-Disposition: attachment;filename="01simple.xls"');
        $writer = PHPExcel_IOFactory::createWriter($writer, 'Excel5');
        $writer->save('php://output');
    }

}


/*$data = array(
    "blah" => array(
        array("type_work" => "dasdsad", "date" => "23.222.444433234", "price" => "223", "fio" => "test test test"),
        array("type_work" => "dasdsadsadsadsa", "date" => "23.222.23232", "price" => "22343", "fio" => "test testsadsad test")
    ),
    "blah34" => array(
        array("type_work" => "dasdsad", "date" => "23.222.444433234", "price" => "223", "fio" => "test test test"),
        array("type_work" => "dasdsadsadsadsa", "date" => "23.222.23232", "price" => "22343", "fio" => "test testsadsad test")
    ),
    "blah45435435" => array(
        array("type_work" => "dasdsad", "date" => "23.222.444433234", "price" => "223", "fio" => "test test test"),
        array("type_work" => "dasdsadsadsadsa", "date" => "23.222.23232", "price" => "22343", "fio" => "test testsadsad test")
    )
);

$w = new XLSWriter;
$w->write( $data );
*/

?>
