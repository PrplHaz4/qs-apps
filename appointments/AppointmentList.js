function AppointmentList() {
    this.teachers = [];
    this.teacherMap = new MapClass();
    
	this.students = [];
	this.studentMap = new MapClass();
	
	this.allSelected = 0;
    
    this.selfTeacherInfo; // Populated if current user is a teacher
    this.selfStudentInfo; // Populated if current user is a student
	
	this.loadTeachers();
	this.loadStudents();
	
	new PageHeaderWidget("Appointment List");
    
    var searchWidget = new SearchWidget("date", "type", "studentNames", "teacherNames");
	
	if(Metis.hasAccess("appt-admin") || Metis.hasAccess("appt-modify-own")) {
		new QuickAddButtonWidget("Add Appointment", this, "clickedAddAppt");
	}
    new LineBreakWidget();
    
    var apptTable = new DataTableWidget(this, "apptTable0226", "datetime", 1);
	searchWidget.setTable(apptTable);
	
	if(Metis.hasAccess("appt-admin") || Metis.hasAccess("appt-modify-own")) {
		apptTable.addSelectorColumn("id", null, function(selections, actionType) {
			this.deleting = new LoadingWidget("Deleting...");
			for(var id in selections) {
				console.log("Deleting ID " + id);
				this.allSelected++;
				Metis.remove(selections[id], this, function() {
					this.allSelected--;
					this.checkSelected();
				});
			}
		});
	}
	
	apptTable.addHeader("Date / Time", "datetime", true, true, 128);
    apptTable.addColumn(function(appointment) {
		var str = "<b>" + appointment.getShortDay() + "</b> " + DateUtil.getShortFormattedDate(appointment.getDate()) + "\n";
		str += new TimeClass(appointment.getTime()).prettyTime + " &nbsp;(" + appointment.getShortDuration() + ")";
        return $H(str);
    });
	
	apptTable.addHeader("Type & Notes", "notes", true);
    apptTable.addColumn(function(appointment) {
		if(appointment.getShortNotes() == "") {
			return $H("<b>" + appointment.getType() + "</b>");
		}
		else {
			return $H("<b>" + appointment.getType() + ':</b> ' + appointment.getShortNotes());
		}
    });
    
    apptTable.addHeader("Student", "studentIds", true);
    apptTable.addColumn(function(appointment) {
		if(this.students[0] === undefined) {
			return appointment.getStudentIds()[0];
		} else {
			return this.studentMap.get(appointment.getStudentIds()[0]);
		}
    });
	
    apptTable.addHeader("Teacher", "teacherIds", true);
    apptTable.addColumn(function(appointment) {
		if(this.teachers[0] === undefined) {
			return appointment.getTeacherIds()[0];
		} else {
			return this.teacherMap.get(appointment.getTeacherIds()[0]);
		}
    });
	
	apptTable.addHeader("Location", "location", true);
    apptTable.addColumn(function(appointment) {
		return appointment.getShortLocation();
    });
	
	this.apptTable = apptTable;
	
	apptTable.setClickHandler(this, "clickedEditAppt");

}

AppointmentList.prototype.clickedAddAppt = function() {
    var dialog = new EditAppointment("add", this.selfTeacherInfo, new Appointment(), this.teachers, this.students, this.teacherMap, this.studentMap);
    dialog.setRefreshHandler(this, function() {
		this.loadApptTable();
    });
};

AppointmentList.prototype.clickedEditAppt = function(apptInfo) {
	if(Metis.hasAccess("appt-admin") || Metis.hasAccess("appt-modify-own")) {
		var dialog = new EditAppointment("edit", this.selfTeacherInfo, apptInfo, this.teachers, this.students, this.teacherMap, this.studentMap);
		dialog.setRefreshHandler(this, function() {
			this.loadApptTable();
		});
	} else if(Metis.hasAccess("appt-student-view")) {
		var dialog = new EditAppointment("view", this.selfTeacherInfo, apptInfo, this.teachers, this.students, this.teacherMap, this.studentMap);
		dialog.setRefreshHandler(this, function() {
			this.loadApptTable();
		});
	}
};

AppointmentList.prototype.loadStudents = function() {
	Rest.get("/sms/v1/students", {fields:"studentPortalUserUserId",itemsPerPage:1000}, this, function(returnData) {
		for(var s in returnData.list)
		{
			var di = new DynamicInfo();
			di.setData("studentId", returnData.list[s].id);
			di.setData("studentName", returnData.list[s].fullName);
            di.setData("userId", returnData.list[s].studentPortalUserUserId);
			this.students.push(di);
			delete di;
			
			this.studentMap.put(returnData.list[s].id, returnData.list[s].fullName);
            
            if(returnData.list[s].studentPortalUserUserId == globalVariables.userObject.getData("id")) {
                console.log("Okay, found self as a student.");
                this.selfStudentInfo = di;
            }
		}
		this.studentsLoaded = true;
		this.checkLoaded();
    });
};

AppointmentList.prototype.loadTeachers = function() {
	Rest.get("/sms/v1/teachers", {fields:"userId",itemsPerPage:1000}, this, function(returnData) {
		for(var t in returnData.list)
		{
			var di = new DynamicInfo();
			di.setData("teacherId", returnData.list[t].id);
			di.setData("teacherName", returnData.list[t].fullName);
            di.setData("userId", returnData.list[t].userId);
			this.teachers.push(di);
			
			this.teacherMap.put(returnData.list[t].id, returnData.list[t].fullName);
            
            if(returnData.list[t].userId == globalVariables.userObject.getData("id")) {
                console.log("Okay, found self as a teacher.");
                this.selfTeacherInfo = di;
            }
		}
		this.teachersLoaded = true;
		this.checkLoaded();
    });
};

AppointmentList.prototype.loadApptTable = function() {
	if(Metis.hasAccess("appt-admin")) {
		console.log("Admin View");
		this.apptTable.renderMetisData(Metis, "Appointments");
	} else if(Metis.hasAccess("appt-modify-own")) {
		console.log("Teacher View");
		this.apptTable.renderMetisData(Metis, "Appointments", new EqFilter("teacherId", this.selfTeacherInfo.getData("teacherId")));
	} else if(Metis.hasAccess("appt-student-view")) {
		console.log("Student View");
		this.apptTable.renderMetisData(Metis, "Appointments", new EqFilter("studentId", this.selfStudentInfo.getData("studentId")));
	}
};

AppointmentList.prototype.checkLoaded = function() {
	if(this.teachersLoaded == true && this.studentsLoaded == true) {
		this.loadApptTable();
	}
};

AppointmentList.prototype.checkSelected = function() {
	if(this.allSelected == 0) {
		this.deleting.close();
		this.apptTable.clearSelections();
		this.loadApptTable();
	}
};