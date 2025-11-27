<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Realtime — Monitoring Energi</title>
  <link rel="stylesheet" href="style.css">
</head>
<body class="dark">
  <div class="container">
    <header class="header">
      <a class="back" href="index.html">← Home</a>
      <h1>Monitoring Real Time</h1>
      <p class="sub">Card-grid — Klik card untuk detail 12 parameter</p>
    </header>

    <section class="controls">
      <label>Auto-refresh:
        <select id="refreshSelect">
          <option value="5000">5s</option>
          <option value="10000">10s</option>
          <option value="30000">30s</option>
        </select>
      </label>
      <button id="simulateToggle" class="btn small">Toggle Simulate (Dummy)</button>
    </section>

    <section id="grid" class="grid"></section>

    <!-- detail modal -->
    <div id="detailModal" class="modal hidden">
      <div class="modal-content">
        <button class="close" onclick="closeDetail()">✕</button>
        <h2 id="detailTitle">MESIN X</h2>
        <div id="detailList" class="detail-list"></div>
      </div>
    </div>

  </div>

  <script src="realtime.js"></script>
</body>
</html>
