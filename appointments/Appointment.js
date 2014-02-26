function Appointment() {
    this.id;
    this.type;
    this.teacherIds = [];
    this.teacherId; // For now, only single
    this.teacherNames = "";
    this.studentIds = [];
    this.studentId; // For now, only single
	this.studentNames = "";
    this.date;
	this.time;
	this.datetime;
    this.duration = "";
	this.durationUnits = "";
    this.location;
	this.notes;
}
Metis.define(Appointment, "Appointments", "id", "type", "teacherIds", "teacherId", "teacherNames", "studentIds", "studentId", "studentNames","date", "time", "datetime", "duration", "durationUnits", "location", "notes");
Metis.defineSortColumn(Appointment, "datetime", "asc");
Metis.createGettersAndSetters(Appointment);

Appointment.prototype.getShortDay = function() {
	var d = new Date(this.date.toJsDate());
	var weekday = new Array(7);
	
	weekday[0]="Sun";
	weekday[1]="Mon";
	weekday[2]="Tue";
	weekday[3]="Wed";
	weekday[4]="Thu";
	weekday[5]="Fri";
	weekday[6]="Sat";
	
	return weekday[d.getDay()];
};

Appointment.prototype.getShortDuration = function() {
	if(this.durationUnits == "all day") {
		return "all day";
	} else {
		return "" + this.duration + " " + this.durationUnits;
		console.log(this.duration);
	}
};

Appointment.prototype.getShortNotes = function() {
	if(this.notes == null || this.notes == undefined || this.notes == "" || this.notes== " ") {
		return "";
	} else if(this.notes.length > 110) {
		return this.notes.substring(0,110) + "...";
	} else {
		return this.notes;
	}
};

Appointment.prototype.getShortLocation = function() {
	if(this.location == null || this.location == undefined || this.location == "") {
		return "";
	} else if(this.location.length > 48) {
		return this.location.substring(0,48) + "...";
	} else {
		return this.location;
	}
};