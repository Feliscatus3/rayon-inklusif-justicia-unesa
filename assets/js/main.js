/**
 * MAIN.JS - Global Utilities for PMII Rayon Inklusif Justicia UNESA
 * Back-to-Top button, WhatsApp floating button, Visitor Counter, Smooth Scroll
 */
(function () {
  "use strict";

  var WA_NUMBER = "6281931100426";
  var WA_MSG = "Halo%20saya%20ingin%20bertanya%20tentang%20PMII%20Rayon%20Inklusif%20Justicia%20UNESA";
  var VISITOR_KEY = "pmii_justicia_visits";

  document.addEventListener("DOMContentLoaded", function () {
    // 1. Back-to-Top button
    var b = document.createElement("button");
    b.id = "back-to-top";
    b.setAttribute("aria-label", "Kembali ke atas");
    b.innerHTML = '<i class="bi bi-chevron-up"></i>';
    document.body.appendChild(b);

    window.addEventListener("scroll", function () {
      if (window.scrollY > 400) {
        b.classList.add("visible");
      } else {
        b.classList.remove("visible");
      }
    });
    b.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    // 2. WhatsApp floating button
    var w = document.createElement("a");
    w.id = "whatsapp-float";
    w.href = "https://wa.me/" + WA_NUMBER + "?text=" + WA_MSG;
    w.target = "_blank";
    w.rel = "noopener noreferrer";
    w.setAttribute("aria-label", "Chat via WhatsApp");
    w.innerHTML = '<i class="bi bi-whatsapp"></i>';
    document.body.appendChild(w);

    // 3. Visitor counter
    var f = document.querySelector("footer");
    if (f) {
      var v = parseInt(localStorage.getItem(VISITOR_KEY) || "0", 10) + 1;
      localStorage.setItem(VISITOR_KEY, v.toString());
      var cr = f.querySelector(".row:last-child .col-md-12");
      if (cr) {
        var d = document.createElement("div");
        d.className = "visitor-counter";
        d.innerHTML = '<i class="bi bi-eye"></i> Pengunjung: ' + v.toLocaleString("id-ID");
        cr.appendChild(d);
      }
    }

    // 4. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = this.getAttribute("href");
        if (id === "#") return;
        var t = document.querySelector(id);
        if (t) {
          e.preventDefault();
          window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: "smooth" });
          var o = document.querySelector(".offcanvas.show");
          if (o) {
            var bs = bootstrap.Offcanvas.getInstance(o);
            if (bs) bs.hide();
          }
        }
      });
    });
  });
})();
