<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class MigrateFlagRole extends Command
{
    protected $signature = 'migrate:flag-role {role} {--on} {--off}';
    protected $description = 'Массово включает/выключает флаг migrated_to_v2 для всех пользователей роли (type_user)';

    public function handle(): int
    {
        $role = (int) $this->argument('role');
        $on = $this->option('on');
        $off = $this->option('off');

        if ($on === $off) {
            $this->error('Укажите ровно один флаг: --on или --off');
            return self::FAILURE;
        }

        $value = $on ? 1 : 0;
        $count = User::where('type_user', $role)->update(['migrated_to_v2' => $value]);

        $this->info("Роль {$role}: обновлено пользователей — {$count} (migrated_to_v2 = {$value})");
        return self::SUCCESS;
    }
}
