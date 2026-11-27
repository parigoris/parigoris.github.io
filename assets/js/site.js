/* Small helpers for every page. No outside requests.
   Copy buttons: shown only when the browser can copy, so readers without JavaScript never see a dead button. */
document.addEventListener('DOMContentLoaded', function () {
  if (!navigator.clipboard) return;
  var buttons = document.querySelectorAll('[data-copy]');
  for (var i = 0; i < buttons.length; i++) {
    (function (button) {
      var code = button.closest('.try').querySelector('code');
      button.hidden = false;
      button.addEventListener('click', function () {
        navigator.clipboard.writeText(code.textContent).then(function () {
          button.textContent = 'Copied';
          setTimeout(function () { button.textContent = 'Copy'; }, 1600);
        });
      });
    })(buttons[i]);
  }
});
