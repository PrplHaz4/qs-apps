function EditAppointment(addOrEdit, selfTeacherInfo, apptInfo, teachers, students, teacherMap, studentMap) {
    ClassUtil.mixin(EditAppointment, this, Refreshable);
    ClassUtil.mixin(EditAppointment, this, Dialogable);
    
    this.addOrEdit = addOrEdit;
    this.selfTeacherInfo = selfTeacherInfo;
    this.apptInfo = apptInfo;
	
	this.teachers = teachers;
	this.students = students;
	
	this.teacherMap = teacherMap;
	this.studentMap = studentMap;
    
	switch(addOrEdit) {
		case "add":
			this.dialog = new Dialog("Add Appointment");
			this.dialog.setOkCancel(this, "clickedSave", "Add");
			this.apptInfo = new Appointment();
			this.apptInfo.date = new Date();
			this.apptInfo.time = "12:00 PM";
			this.apptInfo.duration = 30;
			this.apptInfo.setTeacherIds([this.selfTeacherInfo.getData("teacherId")]);
			break;
		case "edit":
			this.dialog = new Dialog("Edit Appointment");
			this.dialog.setOkCancel(this, "clickedSave", "Update");
			break;
		case "view":
			this.dialog = new Dialog("View Appointment");
			this.dialog.setOk("OK");
			break;
	}
	
	if(this.apptInfo.location == " ")
		this.apptInfo.location = "";
	if(this.apptInfo.notes == " ")
		this.apptInfo.notes = "";
			
    var panel = new QueryPanelWidget(120);
    this.queryFields = new QueryFields(panel, this.apptInfo);
	
	panel.addLabel("Teacher");
    this.queryFields.put("teachers", new EasySelectorWidget(1, this.teachers, "teacherId", "teacherName"));
    
    panel.addLabel("Date");
	this.queryFields.put("date", new DateWidget(), ["validDate"]);
	
	panel.addLabel("Time");
    this.queryFields.put("time", new TimeWidget(new TimeClass(this.apptInfo.time)), ["validTime"]);
	
	panel.addLabel("Duration");
    this.queryFields.put("duration", new InputFieldWidget(this.apptInfo.duration));
	this.queryFields.getWidget("duration").setWidth(118);
	this.queryFields.getWidget("duration").setStyle("durInput");
	this.queryFields.getWidget("duration").setStyle("inline");
	this.queryFields.put("durationUnits", new DropDownWidget(["min", "hr", "all day"]), ["notEmpty"]);
	this.queryFields.getWidget("durationUnits").setStyle("durUnits");
	$(".durUnits select").change(this, function(eventObject) {
		switch(this.value) {
			case "all day":
				$('.durInput input').val("");
				break;
			case "min":
				$('.durInput input').val(30);
				break;
			case "hr":
				$('.durInput input').val(1);
				break;
		}
	});
	
	panel.addLabel("Type");
    this.queryFields.put("type", new DropDownWidget(AppointmentTypes), ["notEmpty"]);
	this.queryFields.getWidget("type").setWidth(128);
	
	panel.addLabel("Student");
    this.queryFields.put("students", new EasySelectorWidget(1, this.students, "studentId", "studentName"));
	
	panel.addLabel("Location");
    this.queryFields.put("location", new InputFieldWidget());
	
	panel.addLabel("Notes / Comments");
    this.queryFields.put("notes", new TextAreaWidget("","Enter appointment notes here"));
    
    panel.finish();
	
	this.loadTeacherSelector(this.queryFields.getWidget("teachers"));
	this.loadStudentSelector(this.queryFields.getWidget("students"));
	
	this.setFieldPermissions();
    
    if(this.addOrEdit == "edit") {
        new DeleteOption("Delete", "Click below to delete this appointment.", this, function() {
            Metis.remove(this.apptInfo, this, function() {
                this.closeDialogBox();
                this.refreshAction.call();
            });
        });
    }
    
    this.dialog.reposition();

}

EditAppointment.prototype.clickedSave = function() {
	var errors = [];
	
	if(this.queryFields.getWidget("durationUnits").getValue() == "all day") {
		this.queryFields.setVerifications("duration", []);
		this.queryFields.getWidget("duration").setValue(" ");
	} else {
		this.queryFields.setVerifications("duration", ["numberOnly", "notLessThan0", "notEmpty"]);
		this.queryFields.getWidget("duration").setValue(this.queryFields.getWidget("duration").getValue().trim());
	}
	
	if(this.queryFields.getWidget("students").getValue().length <= 0) {
		errors.push({label: "Student", message: "Please select a valid student from the list."});
	}
	if(this.queryFields.getWidget("teachers").getValue().length <= 0) {
		errors.push({label: "Teacher", message: "Please select a valid teacher from the list."});
	}
	
	var dateStr = this.queryFields.getWidget("date").getTextValue();
	var date = this.queryFields.getValue("date");
	var pdate = new PlainDate(date);

	if(date == null || !DateUtil.isValidDateString(dateStr)) {
		switch(globalVariables.dateSystem.get("SHORT_DATE_PATTERN")) {
			case "%M/%T/%Y":
				errors.push({label: "Date", message: "Date is not entered properly.  Please enter in this format: MM/DD/YYYY."});
				this.queryFields.setVerifications("date", []);
				break;
			case "%T/%M/%Y":
				errors.push({label: "Date", message: "Date is not entered properly.  Please enter in this format: DD/MM/YYYY."});
				this.queryFields.setVerifications("date", []);
				break;
		}
	}
	
	var timeStr = this.queryFields.getWidget("time").getTextValue();
	var time = this.queryFields.getValue("time");

	if(!this.queryFields.verify(errors)) return false;
    
    this.apptInfo.setTeacherIds(this.queryFields.getValue("teachers"));
    this.apptInfo.setTeacherId(this.queryFields.getValue("teachers")[0]);
	this.setTeacherNames();
	
	this.apptInfo.setStudentIds(this.queryFields.getValue("students"));
    this.apptInfo.setStudentId(this.queryFields.getValue("students")[0]);
	this.setStudentNames();	
	
	this.apptInfo.setDate(new PlainDate(date));
	this.apptInfo.setTime(time.prettyTime24Hour);
	this.setDatetime();
	
	this.apptInfo.setDuration(this.queryFields.getValue("duration").toString());
	this.apptInfo.setDurationUnits(this.queryFields.getValue("durationUnits"));
	this.apptInfo.setType(this.queryFields.getValue("type"));
	
	var location = this.queryFields.getValue("location").toString();
	if(location == "") {
		location = " ";
	}
	this.apptInfo.setLocation(location);
	
	var notes = this.queryFields.getValue("notes").toString();
	if(notes == "") {
		notes = " ";
	}
	this.apptInfo.setNotes(notes);

    Metis.save(this.apptInfo, this, function(){
        this.closeDialogBox();
        this.refreshAction.call();
    });
    
    return false;
};

EditAppointment.prototype.loadStudentSelector = function(studentSelector) {
	studentSelector.setListItems(this.students, "studentId", "studentName");
	studentSelector.setValue(this.apptInfo.studentIds[0]);
};

EditAppointment.prototype.loadTeacherSelector = function(teacherSelector) {
	teacherSelector.setListItems(this.teachers, "teacherId", "teacherName");
	teacherSelector.setValue(this.apptInfo.teacherIds[0]);
};

EditAppointment.prototype.setTeacherNames = function() {
	this.apptInfo.teacherNames = "";
	for(var tid in this.apptInfo.teacherIds) {
		if(this.apptInfo.teacherNames != "") {
			this.apptInfo.teacherNames += ";";
		}
		this.apptInfo.teacherNames += this.teacherMap.get(this.apptInfo.teacherIds[tid]);
	}
};

EditAppointment.prototype.setStudentNames = function() {
	this.apptInfo.studentNames = "";
	for(var id in this.apptInfo.studentIds) {
		if(this.apptInfo.studentNames != "") {
			this.apptInfo.studentNames += ";";
		}
		this.apptInfo.studentNames += this.studentMap.get(this.apptInfo.studentIds[id]);
	}
};

EditAppointment.prototype.setDatetime = function() {
	var date = this.apptInfo.date.toJsDate();
	var time = TimeUtil.parseTimeString(this.apptInfo.time).getDateObject();

	var datetime = new Date(date);
	datetime.setHours(time.getHours());
	datetime.setMinutes(time.getMinutes());
	
	//var dateVal = Date.UTC(datetime.getFullYear(), datetime.getMonth(), datetime.getDate(), datetime.getHours(), datetime.getMinutes());
	var dateVal = this.apptInfo.date + " " + this.apptInfo.time;
	this.apptInfo.datetime = dateVal;

};

EditAppointment.prototype.setFieldPermissions = function() {
	if(Metis.hasAccess("appt-admin")) {
		console.log("Admin View");
	} else if(Metis.hasAccess("appt-modify-own")) {
		console.log("Teacher View");
		this.queryFields.getWidget("teachers").setReadOnly();
	} else if(Metis.hasAccess("appt-student-view")) {
		console.log("Student View");
		this.queryFields.getWidget("teachers").setReadOnly();
		this.queryFields.getWidget("date").setReadOnly();
		this.queryFields.getWidget("time").setReadOnly();
		this.queryFields.getWidget("duration").setReadOnly();
		this.queryFields.getWidget("durationUnits").setReadOnly();
		this.queryFields.getWidget("type").setReadOnly();
		this.queryFields.getWidget("students").setReadOnly();
		this.queryFields.getWidget("location").setReadOnly();
		this.queryFields.getWidget("notes").setReadOnly();
	}
};