@php
    $record = $getRecord();
    $url = $record ? Storage::url($record->requisition_form_path) : null;
@endphp

@if ($url)
    <div class="px-4 py-3">
        <a href="{{ $url }}" target="_blank" class="text-primary-600 hover:text-primary-500">
            View Requisition Form
        </a>
    </div>
@else
    <div class="px-4 py-3 text-gray-500">
        No requisition form available
    </div>
@endif 