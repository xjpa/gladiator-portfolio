document.addEventListener('DOMContentLoaded', function () {
  const toggleDetailsElements = document.querySelectorAll('.toggle-details');

  toggleDetailsElements.forEach(function (toggleDetails) {
    toggleDetails.addEventListener('click', function () {
      const expandingDetails = toggleDetails.parentElement.nextElementSibling;

      expandingDetails.classList.toggle('active');
    });
  });
});
