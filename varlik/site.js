/* Road is Life: sayfalardaki küçük canlı parçalar. Sayfa betiksiz de eksiksiz okunur; bunlar yalnızca süs ve kolaylık. */
(function () {
  "use strict";

  /* Geri tuşu: siteden gelindiyse tarayıcı geçmişinde bir adım geri, yoksa bağlantıdaki üst sayfa */
  document.querySelectorAll("[data-geri]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      try { if (document.referrer && new URL(document.referrer).origin === location.origin && history.length > 1) { e.preventDefault(); history.back(); } } catch (x) {}
    });
  });

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
          var hl = el.getAttribute("data-hal-liste"), hal = hl ? JSON.parse(hl) : [[2, "Şehir uyuyor; çeşmeler sana kalıyor"], [7, "Barlarda ayakta cornetto ve cappuccino saati"], [10, "Müzeler açık; sıra uzamadan gir"], [13, "Pranzo: öğle yemeği saati"], [15, "Sıcak saatler; gelato molası zamanı"], [18, "Aperitivo saati: spritz ve atıştırmalık"], [20, "Trattorialar doluyor; masan hazır mı?"], [23, "Gece kuşları hâlâ sokakta"]];
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
    var VZ = JSON.parse(pv.textContent), uy = pas.elements.uyruk, tr = pas.elements.tur, vr = pas.elements.varis, ul = pas.elements.ulke;
    var dg = pas.querySelector(".damga"), mt = pas.querySelector("[data-pas-metin]"), git = pas.querySelector("[data-pas-git]");
    var alanlar = pas.querySelector(".pfields"), sehirAlan = pas.querySelectorAll(".pf-sehir");
    var sakin = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
    var pasGuncelle = function (anim) {
      tr.disabled = uy.value !== "TR";
      var v = VZ[uy.value === "TR" ? tr.value : uy.value];
      pas.querySelector(".pas-sonuc").hidden = !uy.value;
      if (v) { dg.children[0].textContent = v.s1; dg.children[1].textContent = v.s2; dg.children[2].textContent = v.s3; mt.textContent = v.h; }
      // Önce ülke, sonra şehir: seçilen ülkenin şehir alanı ülkenin yanında açılır
      var u = ul ? ul.value : "italya", acik = null;
      for (var i = 0; i < sehirAlan.length; i++) { var a = sehirAlan[i].getAttribute("data-ulke") === u; sehirAlan[i].hidden = !a; if (a) acik = sehirAlan[i].querySelector("select"); }
      alanlar.classList.toggle("sehirli", !!acik);
      git.classList.toggle("pasif", !acik);
      if (!acik) { git.href = "#"; git.textContent = "Önce ülkeni seç"; }
      else if (u === "italya" || acik.closest("[data-hazir]")) { var o = acik.options[acik.selectedIndex]; git.href = o.value; git.textContent = o.text + " dosyasını aç"; }
      else { git.href = acik.value; git.textContent = ul.options[ul.selectedIndex].text.split(" · ")[0] + " dosyasına göz at"; }
      if (anim && !sakin) { dg.classList.remove("vur"); void dg.offsetWidth; dg.classList.add("vur"); }
    };
    // damga yalnız uyruk ya da pasaport türü değişince yeniden basılır; varış (küreden de gelir) yalnız düğmeyi değiştirir
    // küreden İtalya şehri seçilince ülke de İtalya olur
    pas.addEventListener("change", function (e) { if (e.target === vr && ul) ul.value = "italya"; pasGuncelle(e.target === uy || e.target === tr); });
    pas.addEventListener("submit", function (e) { e.preventDefault(); if (!git.classList.contains("pasif")) location.href = git.href; else if (ul) ul.focus(); });
    git.addEventListener("click", function (e) { if (git.classList.contains("pasif")) { e.preventDefault(); if (ul) ul.focus(); } });
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
/* Ana sayfa ülke kartları: pasaport kartındaki uyruk + tür → her ülkenin vize rozeti; vizesizler öne geçer */
  var uk = document.querySelector("[data-ulkeler]"), pk = document.querySelector("[data-pasaport]");
  if (uk && pk) {
    var rozet = function (grup, uy, tr) {
      if (uy === "TR") return grup === "tr" ? ["Kendi ülken", "ev"] : tr === "bordo" ? ["Schengen vizesi gerekir", "vize"] : ["Vizesiz · 90 gün", "serbest"];
      if (uy === "EU") return grup === "tr" ? ["Çoğu AB uyruğuna vizesiz", "serbest"] : ["Vize yok · AB vatandaşı", "serbest"];
      if (uy === "AZ") return grup === "tr" ? ["Vizesiz · 90 gün", "serbest"] : ["Schengen vizesi gerekir", "vize"];
      return uy ? ["Uyruğuna göre değişir", "bilinmez"] : ["Vize durumu için uyruğunu seç", "bilinmez"];
    };
    var kartlar = Array.prototype.slice.call(uk.querySelectorAll("[data-vize]"));
    var ukGuncelle = function () {
      var uy = pk.elements.uyruk.value, tr = pk.elements.tur.value;
      kartlar.forEach(function (k, i) {
        var r = rozet(k.getAttribute("data-vize"), uy, tr), e = k.querySelector("[data-vize-rozet]");
        e.textContent = r[0]; e.className = "etiket vz-" + r[1];
        k.style.order = r[1] === "vize" || r[1] === "bilinmez" ? 10 + i : i;
      });
    };
    pk.addEventListener("change", ukGuncelle);
    ukGuncelle();
  }

  /* Üst menü Ülkeler paneli: dışarı tıklanınca ya da Esc ile kapanır */
  var um = document.querySelector(".ust-ulke");
  if (um) {
    document.addEventListener("click", function (e) { if (um.open && !um.contains(e.target)) um.open = false; });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && um.open) { um.open = false; um.querySelector("summary").focus(); } });
  }

  /* Şehirler arası: nereden–nereye seçilince güzergah kartı ve bilet bağlantıları */
  var hk = document.querySelector("[data-hat-ara]");
  if (hk) {
    var H = JSON.parse(hk.querySelector("[data-hat-veri]").textContent);
    var nd = hk.querySelector("[name=nereden]"), ny = hk.querySelector("[name=nereye]"), so = hk.querySelector("[data-hat-sonuc]");
    var srt = function (x) { return x.sort(function (p, q) { return p.localeCompare(q, "tr"); }); };
    var doldur = function (sel, adlar) {
      sel.length = 1;
      adlar.forEach(function (a) { sel.add(new Option(a, a)); });
      sel.disabled = !adlar.length;
    };
    var el = function (etiket, metin, sinif) { var e = document.createElement(etiket); if (metin) e.textContent = metin; if (sinif) e.className = sinif; return e; };
    var tumu = {};
    H.forEach(function (h) { tumu[h.a] = 1; tumu[h.b] = 1; });
    doldur(nd, srt(Object.keys(tumu)));
    doldur(ny, []);
    var goster = function () {
      var x = nd.value, y = ny.value, h = null, ters = false;
      H.forEach(function (r) { if (r.a === x && r.b === y) h = r; else if (r.a === y && r.b === x) { h = r; ters = true; } });
      so.hidden = !h;
      so.textContent = "";
      if (!h) return;
      var k = el("div", "", "hat-kart");
      k.appendChild(el("h3", x + " – " + y));
      k.appendChild(el("p", h.t, "hat-tur"));
      var dl = el("dl");
      [["Süre", h.s], [hk.getAttribute("data-gar") || "Garlar", ters ? h.g.split(" → ").join(" ↔ ") : h.g], ["Bilet", h.f]].forEach(function (s) { dl.appendChild(el("dt", s[0])); dl.appendChild(el("dd", s[1])); });
      k.appendChild(dl);
      k.appendChild(el("p", h.n, "hat-not"));
      var d = el("div", "", "dugmeler");
      h.l.forEach(function (l, i) { var a = el("a", l[0] + " →", i ? "btn ikinci" : "btn"); a.href = l[1]; a.target = "_blank"; a.rel = "noopener"; d.appendChild(a); });
      k.appendChild(d);
      if (h.l.length) k.appendChild(el("p", hk.getAttribute("data-not"), "dip"));
      so.appendChild(k);
    };
    nd.addEventListener("change", function () {
      var x = nd.value, b = {};
      H.forEach(function (r) { if (r.a === x) b[r.b] = 1; if (r.b === x) b[r.a] = 1; });
      doldur(ny, x ? srt(Object.keys(b)) : []);
      goster();
    });
    ny.addEventListener("change", goster);
  }

  /* Mekân notu formu: "Listede yok, başka bir yer" seçilince yeni mekânın alanları açılır */
  document.querySelectorAll(".not-form select[name=mekan]").forEach(function (sec) {
    function guncelle() { sec.form.querySelectorAll("[data-yeni]").forEach(function (el) { el.hidden = sec.value !== "_yeni"; }); }
    sec.addEventListener("change", guncelle);
    guncelle();
  });
})();
