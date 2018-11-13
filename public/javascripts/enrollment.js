

function generateEnrollment(requests, courses) {
  requests.sort(function(student1, student2) {
    return student1.order - student2.order;
  });
  for (let i = 0; i < requests.length; i++) {
    let student = requests[i];
    let enrolled = false;
    console.log("enrolling", student.name)
    for (let j = 0; j < student.preferences.length; j++) {
      if (student.preferences[i] != '') {
        let course = student.preferences[j];
        console.log("checking", course.day)
        if (course.students.length < course.capacity) {
          course.students.push(student.name)
          console.log("student added", student.name, course.day )
          enrolled = true;
          break;
      }
      else console.log("no space in", course.day)
      }   
    }
    if (enrolled == false) {
      console.log("add to waitlist")
      student.preferences[0].waitlist.push(student.name);
    }
  }
console.log(courses)
}