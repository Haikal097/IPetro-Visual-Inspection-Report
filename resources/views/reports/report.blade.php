<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; font-size: 12px; }
    .box { border: 1px solid #000; padding: 10px; margin-top: 10px; }
    .row { display: flex; gap: 20px; }
    .col { flex: 1; }
    .muted { color: #666; }
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
      {{ $report->signed_at ? $report->signed_at->format('d M Y, h:i A') : '-' }}
    </div>
    <div class="col">
      <b>Signature:</b><br>
      @php
        $sig = $report->signature_snapshot_path
          ? public_path('storage/'.$report->signature_snapshot_path)
          : null;
      @endphp

      @if($sig && file_exists($sig))
        <img src="{{ $sig }}" style="height:80px; border:1px solid #ddd; padding:4px;">
      @else
        <span class="muted">(Not signed yet)</span>
      @endif
    </div>
  </div>
</div>

</body>
</html>
