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

  /* Rotama ekle: planlayıcıyla aynı kayıt (localStorage "seyyah-<şehir>-v1"; şehir ve varsayılan bölge düğmede) */
  var KEY = "";
  function oku() { try { var s = JSON.parse(localStorage.getItem(KEY)); if (s && Array.isArray(s.plan)) return s; } catch (e) {} return null; }
  function yaz(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
  document.querySelectorAll("[data-rota]").forEach(function (b) {
    KEY = "seyyah-" + b.getAttribute("data-sehir") + "-v1";
    var id = b.getAttribute("data-rota"), us = b.getAttribute("data-us"), msg = document.querySelector("[data-rota-mesaj]");
    function goster() {
      var s = oku(), on = !!(s && s.plan.indexOf(id) > -1);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      b.textContent = on ? "Rotanda ✓" : "+ Rotama ekle";
    }
    b.hidden = false; goster();
    b.addEventListener("click", function () {
      var s = oku() || { plan: [], visited: [], base: us, sample: false, bag: [] };
      if (s.sample) { s.plan = []; s.sample = false; }
      var i = s.plan.indexOf(id);
      if (i > -1) s.plan.splice(i, 1); else s.plan.push(id);
      var ok = yaz(s); goster();
      if (msg) msg.textContent = !ok ? "Tarayıcın kayda izin vermiyor." : (i > -1 ? "Rotandan çıkarıldı." : "Rotana eklendi. Rotanda " + s.plan.length + " yer var.");
    });
  });

  /* Ana sayfa pasaport kartı: uyruk ve pasaport türü vize damgasını, varış "dosyasını aç" düğmesini değiştirir */
  var pas = document.querySelector("[data-pasaport]"), pv = document.getElementById("pasaport-veri");
  if (pas && pv) {
    var VZ = JSON.parse(pv.textContent), uy = pas.elements.uyruk, tr = pas.elements.tur, vr = pas.elements.varis;
    var dg = pas.querySelector(".damga"), mt = pas.querySelector("[data-pas-metin]"), git = pas.querySelector("[data-pas-git]");
    var sakin = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pasGuncelle = function (anim) {
      tr.disabled = uy.value !== "TR";
      var v = VZ[uy.value === "TR" ? tr.value : uy.value];
      if (v) { dg.children[0].textContent = v.s1; dg.children[1].textContent = v.s2; dg.children[2].textContent = v.s3; mt.textContent = v.h; }
      var o = vr.options[vr.selectedIndex];
      git.href = o.value; git.textContent = o.text.split(",")[0] + " dosyasını aç";
      if (anim && !sakin) { dg.classList.remove("vur"); void dg.offsetWidth; dg.classList.add("vur"); }
    };
    // damga yalnız uyruk ya da pasaport türü değişince yeniden basılır; varış (küreden de gelir) yalnız düğmeyi değiştirir
    pas.addEventListener("change", function (e) { pasGuncelle(e.target !== vr); });
    pas.addEventListener("submit", function (e) { e.preventDefault(); location.href = git.href; });
    pasGuncelle(false);
  }

  /* Ana sayfa kapağı: arkadaki şehir fotoğrafları 7 sn'de bir değişir (sıradaki önceden yüklenir); varış seçilince o şehrin
     fotoğrafı kalır. Hareket azaltma ya da veri tasarrufu açıksa kendiliğinden değişmez. */
  var sl = document.querySelector("[data-slayt]");
  if (sl) {
    var kat = Array.prototype.slice.call(sl.querySelectorAll(".ana-foto")), yz = sl.querySelector(".ana-yazi span");
    var dar = window.matchMedia ? matchMedia("(max-width: 760px)") : null;
    var tasarruf = !!(navigator.connection && navigator.connection.saveData);
    var su = 0, sira = 0, kilit = false, temizle = 0;
    var yukle = function (el, bitti) {
      var a = el.getAttribute("data-img"), k = el.getAttribute("data-img-k");
      if (!a || el.getAttribute("data-hazir")) return bitti();
      var im = new Image();
      im.onload = im.onerror = function () {
        el.style.setProperty("--img", "url('" + a + "')");
        el.style.setProperty("--img-k", "url('" + k + "')");
        el.setAttribute("data-hazir", "1");
        bitti();
      };
      im.src = dar && dar.matches && k ? k : a;
    };
    var gec = function (i) {
      if (i === su || !kat[i]) return;
      var t = ++sira;
      yukle(kat[i], function () {
        if (t !== sira) return; // bu arada başka bir fotoğraf istendi
        var eski = kat[su], yeni = kat[i];
        kat.forEach(function (el) { if (el !== eski && el !== yeni) el.classList.remove("aktif", "onceki"); });
        eski.classList.remove("aktif"); eski.classList.add("onceki");
        yeni.classList.remove("onceki"); yeni.classList.add("aktif");
        su = i;
        if (yz) yz.textContent = yeni.getAttribute("data-yazi");
        clearTimeout(temizle);
        temizle = setTimeout(function () { eski.classList.remove("onceki"); }, 1600);
        if (!kilit && kat.length > 1) yukle(kat[(i + 1) % kat.length], function () {});
      });
    };
    if (!sakinMi() && !tasarruf && kat.length > 1) {
      setTimeout(function () { yukle(kat[1], function () {}); }, 2500);
      setInterval(function () { if (!kilit && !document.hidden) gec((su + 1) % kat.length); }, 7000);
    }
    var pf = document.querySelector("[data-pasaport]");
    if (pf) pf.addEventListener("change", function (e) {
      if (e.target.name !== "varis") return;
      var o = e.target.options[e.target.selectedIndex], id = o && o.getAttribute("data-id");
      for (var i = 0; i < kat.length; i++) if (kat[i].getAttribute("data-sehir") === id) { kilit = true; gec(i); break; }
    });
  }
  function sakinMi() { return !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches); }
  /* Fotoğraf büyütme: <button class="buyut" data-buyuk="büyük.jpg"><img alt="..."></button> → tam ekran, dokununca ya da Esc ile kapanır */
  var buyutler = document.querySelectorAll(".buyut");
  if (buyutler.length && window.HTMLDialogElement) {
    var dlg = document.createElement("dialog");
    dlg.className = "isik";
    dlg.innerHTML = '<button type="button" class="isik-kapat" aria-label="Kapat">×</button><img alt=""><p></p>';
    document.body.appendChild(dlg);
    var dImg = dlg.querySelector("img"), dYazi = dlg.querySelector("p"), son = null;
    buyutler.forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.querySelector("img");
        son = b;
        dImg.src = b.getAttribute("data-buyuk");
        dImg.alt = k ? k.alt : "";
        dYazi.textContent = k ? k.alt : "";
        dlg.showModal();
      });
    });
    dlg.addEventListener("click", function () { dlg.close(); });
    dlg.addEventListener("close", function () { dImg.removeAttribute("src"); if (son) son.focus(); });
  }
})();
