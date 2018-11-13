document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

  document.getElementById("addDate").onclick = function (event) {
    console.log("clicked")
    event.preventDefault()
    document.getElementById("class-dates").innerHTML += <li>document.getElementById("date").value</li>
  }

}, false);


