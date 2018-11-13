document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

  document.getElementById("addDate").onclick = function (event) {
    event.preventDefault()
    var innerValue = document.getElementById("dates").value
    console.log(innerValue)
    document.getElementById("class-dates").innerHTML += `<li class="newDates">${innerValue}</li>`
  }

}, false);


