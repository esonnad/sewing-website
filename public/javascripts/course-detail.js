document.addEventListener('DOMContentLoaded', () => {

  console.log('Course Detail JS imported successfully!');

  document.getElementById("addDate").onclick = function (event) {
    event.preventDefault()
    document.getElementById("class-dates").innerHTML += `<input type="date" name="date">`
  }

  document.getElementById("addStudent").onclick = function (event) {
    event.preventDefault()
    console.log("clicked")
    var studd = document.getElementById("studentOption").value
    document.getElementById("class-students").innerHTML += `<li>${studd}</li>`
  }

}, false);