<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class MigrateUsers extends Command
{
    protected $signature = 'migrate:users {--source=firmaacru_legacy}';
    protected $description = 'Перенос пользователей из legacy-БД с обработкой дублей';

    public function handle(): int
    {
        $source = $this->option('source');
        $this->info("Миграция users из {$source}...");

        $legacyUsers = DB::connection('legacy')->table('users')->get();
        $this->info("Найдено пользователей: {$legacyUsers->count()}");

        $seen = [];
        $migrated = 0;
        $skipped = 0;

        foreach ($legacyUsers as $user) {
            // Дубли: first-wins по login, дубль переименовываем
            $login = $user->login;
            if (isset($seen[$login])) {
                $login = $login . '_dup' . $user->id;
                $this->warn("  Дубль login '{$user->login}' → '{$login}' (id={$user->id})");
                $skipped++;
            }
            $seen[$login] = true;

            DB::table('users')->insertOrIgnore([
                'id' => $user->id,
                'email' => $user->email,
                'login' => $login,
                'passwd' => $user->passwd, // MD5 переносится как есть, ленивый re-hash при логине
                'type_user' => $user->type_user,
                'fio' => $user->fio ?? '',
            ]);
            $migrated++;
        }

        $this->info("✅ Перенесено: {$migrated}, дублей обработано: {$skipped}");
        return self::SUCCESS;
    }
}
