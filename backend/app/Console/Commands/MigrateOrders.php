<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateOrders extends Command
{
    protected $signature = 'migrate:orders {--source=firmaacru_legacy}';
    protected $description = 'Перенос заказов из legacy-БД (1:1, без FK-ограничений)';

    public function handle(): int
    {
        $source = $this->option('source');
        $this->info("Миграция orders из {$source}...");

        // Читаем порциями (память)
        $legacyOrders = DB::connection('legacy')->table('orders')->orderBy('id')->get();
        $this->info("Найдено заказов: {$legacyOrders->count()}");

        $migrated = 0;

        foreach ($legacyOrders as $o) {
            DB::table('orders')->insertOrIgnore([
                'id' => $o->id,
                'date_create' => $o->date_create,
                'date' => $o->date,
                'trc' => $o->trc,
                'trc_other' => $o->trc_other,
                'type_work' => $o->type_work,
                'brand' => $o->brand,
                'where_print' => $o->where_print,
                'where_other' => $o->where_other,
                'photo' => $o->photo,
                'price' => $o->price,
                'price_admin' => $o->price_admin,
                'importance' => $o->importance,
                'importance_other' => $o->importance_other,
                'created_by' => $o->created_by, // без FK — орфаны сохраняются
                'created_for' => $o->created_for,
                'status' => $o->status,
                'comments' => $o->comments,
                'is_archived' => $o->is_archived,
                'comment_manager' => $o->comment_manager,
            ]);
            $migrated++;
        }

        $this->info("✅ Перенесено заказов: {$migrated}");
        return self::SUCCESS;
    }
}
