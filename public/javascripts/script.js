document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

  document.getElementById("addDate").onclick = function (event) {
    event.preventDefault()
    document.getElementById("class-dates").innerHTML += `<input type="date" name="date">`
  }

}, false);


