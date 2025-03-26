<?php

namespace App\Filament\Resources\BloodRequestResource\Pages;

use App\Filament\Resources\BloodRequestResource;
use Filament\Actions;
use Filament\Resources\Pages\EditRecord;

class EditBloodRequest extends EditRecord
{
    protected static string $resource = BloodRequestResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }
}
