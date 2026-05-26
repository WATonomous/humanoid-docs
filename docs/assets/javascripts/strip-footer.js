// Remove third-party footer attributions injected by theme extensions.
(function () {
  function stripFooterAttributions() {
    var footer = document.querySelector("footer");
    if (!footer) return;

    footer.innerHTML = "";
  }

  window.addEventListener("load", function () {
    stripFooterAttributions();
    setTimeout(stripFooterAttributions, 0);
  });
})();
