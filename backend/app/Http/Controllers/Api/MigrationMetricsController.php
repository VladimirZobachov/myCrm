<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class MigrationMetricsController extends Controller
{
    /**
     * GET /api/migration/metrics — сводка по миграции на v2 (только админ, задача #64).
     */
    public function __invoke(): JsonResponse
    {
        abort_unless(auth('api')->user()?->isAdmin(), 403);

        $rows = User::query()
            ->select('type_user')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN migrated_to_v2 = 1 THEN 1 ELSE 0 END) as migrated')
            ->groupBy('type_user')
            ->get();

        $total = (int) $rows->sum('total');
        $migrated = (int) $rows->sum('migrated');

        $byRole = $rows->map(function ($row) {
            $roleTotal = (int) $row->total;
            $roleMigrated = (int) $row->migrated;

            return [
                'role' => (int) $row->type_user,
                'total' => $roleTotal,
                'migrated' => $roleMigrated,
                'percent' => $roleTotal > 0 ? round($roleMigrated / $roleTotal * 100, 1) : 0,
            ];
        })->values();

        return response()->json([
            'total' => $total,
            'migrated' => $migrated,
            'percent' => $total > 0 ? round($migrated / $total * 100, 1) : 0,
            'by_role' => $byRole,
        ]);
    }
}
