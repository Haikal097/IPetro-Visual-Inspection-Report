<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: DejaVu Sans, Arial, sans-serif; font-size: 12px; }
        .box { border: 1px solid #000; padding: 10px; }
        .row { display: flex; justify-content: space-between; gap: 20px; }
        .col { width: 48%; }
        .muted { color: #666; font-size: 11px; }
        .sig { height: 80px; }
        .qr { height: 90px; }
    </style>
</head>
<body>

<h2>Visual Inspection Report</h2>

<div class="box">
    <div class="row">
        <div class="col">
            <b>Report ID:</b> {{ $report->id }}<br>
            <b>Inspector:</b> {{ optional($report->inspector)->name ?? '-' }}<br>
            <b>Signed At:</b>
            {{ $report->signed_at ? $report->signed_at->timezone('Asia/Kuala_Lumpur')->format('d M Y, h:i A') : '-' }}<br>
            <b>Signed IP:</b> {{ $report->signed_ip ?? '-' }}<br>
            <span class="muted">Signature Hash (SHA-256): {{ $report->signature_sha256 ?? '-' }}</span><br>
            <span class="muted">PDF Hash (SHA-256): {{ $report->pdf_sha256 ?? '-' }}</span>
        </div>

        <div class="col">
            <b>Signature:</b><br>
            @php
                $sigPath = $report->signature_snapshot_path
                    ? public_path('storage/'.$report->signature_snapshot_path)
                    : null;
            @endphp

            @if($sigPath && file_exists($sigPath))
                <img class="sig" src="{{ $sigPath }}">
            @else
                <span class="muted">(Not signed)</span>
            @endif

            <div style="margin-top:10px;">
                <b>Verify:</b><br>
                {{-- You can replace this QR image with a real QR generator later --}}
                <span class="muted">
                    Token: {{ $report->verification_token ?? '-' }}
                </span>
            </div>
        </div>
    </div>
</div>

{{-- Your existing report layout content continues here... --}}

</body>
</html>
