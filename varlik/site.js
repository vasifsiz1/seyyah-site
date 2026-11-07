/* Seyyah: sayfalardaki küçük canlı parçalar. Sayfa betiksiz de eksiksiz okunur; bunlar yalnızca süs ve kolaylık. */
(function () {
  "use strict";

  /* Canlı saat ve gün batımı: <span data-saat="Europe/Rome" data-enlem="41.9" data-boylam="12.5"> */
  function gunBatimi(d, lat, lng) {
    var rad = Math.PI / 180, n = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    var g = 2 * Math.PI / 365 * (n - 1);
    var eqt = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
    var decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
    var ha = Math.acos(Math.cos(90.833 * rad) / (Math.cos(lat * rad) * Math.cos(decl)) - Math.tan(lat * rad) * Math.tan(decl)) / rad;
    var dk = 720 - 4 * (lng - ha) - eqt;
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) + dk * 6e4);
  }
  var saatler = document.querySelectorAll("[data-saat]");
  function tik() {
    var now = new Date();
    saatler.forEach(function (el) {
      var tz = el.getAttribute("data-saat");
      try {
        var f = new Intl.DateTimeFormat("tr-TR", { timeZone: tz, hour: "2-digit", minute: "2-digit" });
        var s = el.querySelector("[data-simdi]"); if (s) s.textContent = f.format(now);
        var b = el.querySelector("[data-batim]"); var la = +el.getAttribute("data-enlem"), lo = +el.getAttribute("data-boylam");
        if (b && la) b.textContent = f.format(gunBatimi(now, la, lo));
        var v = el.querySelector("[data-hal]");
        if (v) {
          var h = +new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now);
          var hal = [[2, "Şehir uyuyor; çeşmeler sana kalıyor"], [7, "Barlarda ayakta cornetto ve cappuccino saati"], [10, "Müzeler açık; sıra uzamadan gir"], [13, "Pranzo: öğle yemeği saati"], [15, "Sıcak saatler; gelato molası zamanı"], [18, "Aperitivo saati: spritz ve atıştırmalık"], [20, "Trattorialar doluyor; masan hazır mı?"], [23, "Gece kuşları hâlâ sokakta"]];
          var t = hal[hal.length - 1][1]; for (var i = 0; i < hal.length; i++) if (h >= hal[i][0]) t = hal[i][1];
          if (h < 2) t = hal[hal.length - 1][1];
          v.textContent = t;
        }
      } catch (e) {}
    });
  }
  if (saatler.length) { tik(); setInterval(tik, 30000); }

  /* Rotama ekle: planlayıcıyla aynı kayıt (localStorage "seyyah-roma-v1") */
  var KEY = "seyyah-roma-v1";
  function oku() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.plan)) return s; } catch (e) {} return null; }
  function yaz(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  document.querySelectorAll("[data-rota]").forEach(function (b) {
    var id = b.getAttribute("data-rota"), msg = document.querySelector("[data-rota-mesaj]");
    function goster() {
      var s = oku(), on = !!(s && s.plan.indexOf(id) > -1);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "Rotanda ✓" : "+ Rotama ekle";
    }
    b.hidden = false; goster();
    b.addEventListener("click", function () {
      var s = oku() || { plan: [], visited: [], base: "monti", sample: false, bag: [] };
      if (s.sample) { s.plan = []; s.sample = false; }
      var i = s.plan.indexOf(id);
      if (i > -1) s.plan.splice(i, 1); else s.plan.push(id);
      var ok = yaz(s); goster();
      if (msg) msg.textContent = !ok ? "Tarayıcın kayda izin vermiyor." : (i > -1 ? "Rotandan çıkarıldı." : "Rotana eklendi. Rotanda " + s.plan.length + " yer var.");
    });
  });
})();
