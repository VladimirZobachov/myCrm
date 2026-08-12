<?php

namespace App\Services\Export;

/**
 * Конфиги колонок трёх вариантов экспорта — перенесены как есть из legacy
 * index.php::export() (заголовки таблиц) и includes/db.class.php::getOrdersForExport()
 * (группировка/сумма), см. также includes/PHPExcel/writer.php::write().
 *
 * Формат колонки: [заголовок, поле (или выражение "a - b" / "a + b", или null для пустой
 * колонки), буква столбца]. Формат sum: [поле_или_выражение, буква_столбца] — колонка,
 * в подвал которой пишется агрегированная сумма по всем строкам.
 */
class OrderExportConfig
{
    public const GROUP_BY_TRC = 'trc';
    public const GROUP_BY_FIO = 'fio';

    /**
     * Админ, детальный вид (type_user==1, без ?sum=1). Группировка по ТРЦ.
     * В legacy sum_price=null — колонки "сумма менеджеры"/"доход" всегда пустые
     * (заполняются вручную), автосуммы нет.
     */
    public static function adminDetailed(): array
    {
        return [
            'headers' => [
                ['№', 'id', 'A'],
                ['Наименование работ и место производства', 'type_work', 'B'],
                ['Дата', 'date', 'C'],
                ['Фонд оплаты рабочих', 'price', 'D'],
                ['Оплата на ИнЦентр', 'fio', 'E'],
                [' ', null, 'F'],
                ['сумма менеджеры', null, 'G'],
                ['доход', null, 'H'],
            ],
            'sum' => null,
            'group_by' => self::GROUP_BY_TRC,
        ];
    }

    /**
     * Монтажник (type_user==3). Группировка по ТРЦ, автосумма по "Стоимость" (price_admin).
     */
    public static function mounter(): array
    {
        return [
            'headers' => [
                ['№ заказа', 'id', 'A'],
                ['Дата монтажа', 'date', 'B'],
                ['Вид работ', 'type_work', 'C'],
                ['Фотопривязка', 'photo', 'D'],
                ['Стоимость', 'price_admin', 'E'],
            ],
            'sum' => ['price_admin', 'E'],
            'group_by' => self::GROUP_BY_TRC,
        ];
    }

    /**
     * Админ, сводный вид (type_user==1, ?sum=1). Группировка по fio создателя заявки
     * (менеджера, orders.created_by), а не по ТРЦ. Автосумма по "Сумма" = price - price_admin
     * (см. writer.php: sum_price = ["price - price_admin", "H"] — колонка "доход" в задаче
     * это именно это поле; в legacy это price - price_admin, а не наоборот).
     */
    public static function adminSummary(): array
    {
        return [
            'headers' => [
                ['№ заказа', 'id', 'A'],
                ['Дата монтажа', 'date', 'B'],
                ['ТРЦ', '_trc', 'C'],
                ['Вид работ', 'type_work', 'D'],
                ['Фотопривязка', 'photo', 'E'],
                ['Стоимость мен.', 'price', 'F'],
                ['Стоимость', 'price_admin', 'G'],
                ['Сумма', 'price - price_admin', 'H'],
            ],
            'sum' => ['price - price_admin', 'H'],
            'group_by' => self::GROUP_BY_FIO,
        ];
    }
}
