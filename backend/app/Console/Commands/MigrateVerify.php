<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateVerify extends Command
{
    protected $signature = 'migrate:verify {--source=firmaacru_legacy}';
    protected $description = 'Сверка количества и контрольных сумм между legacy и новой БД';

    public function handle(): int
    {
        $source = $this->option('source');
        $this->info("=== ВЕРИФИКАЦИЯ МИГРАЦИИ ({$source} → firmaacru_crm) ===");

        $tables = ['users', 'orders', 'sessions'];
        $ok = true;

        foreach ($tables as $table) {
            $legacyCount = DB::connection('legacy')->table($table)->count();
            $newCount = DB::table($table)->count();
            if ($table === 'sessions') {
                // sessions намеренно НЕ мигрируются (JWT stateless, см. docs/SESSION_MIGRATION.md)
                $this->line("  {$table}: legacy={$legacyCount}, new={$newCount} (намеренно не мигрируется)");
                continue;
            }
            $match = $legacyCount === $newCount ? '✅' : '❌';
            if (!$match) $ok = false;
            $this->line("  {$table}: legacy={$legacyCount}, new={$newCount} {$match}");
        }

        // Контрольные суммы по ключевым полям orders
        $legacySum = DB::connection('legacy')->table('orders')->sum('id');
        $newSum = DB::table('orders')->sum('id');
        $sumMatch = $legacySum === $newSum ? '✅' : '❌';
        if (!$sumMatch) $ok = false;
        $this->line("  orders SUM(id): legacy={$legacySum}, new={$newSum} {$sumMatch}");

        $legacyMax = DB::connection('legacy')->table('orders')->max('id');
        $newMax = DB::table('orders')->max('id');
        $this->line("  orders MAX(id): legacy={$legacyMax}, new={$newMax}");

        $this->line($ok ? "\n✅ МИГРАЦИЯ ПРОШЛА УСПЕШНО" : "\n❌ ЕСТЬ РАСХОЖДЕНИЯ!");
        return $ok ? self::SUCCESS : self::FAILURE;
    }
}
