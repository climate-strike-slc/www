var adminFunctions = {
	formatDate: function(which, e) {
		var self = this;
		// switch(which) {
		// 	case 'month':
		// 		val = months[val];
		// 		break;
		// 	case 'day':
		// 		val = (val < 10 ? '0'+val : val);
		// 		break;
		// 	case 'hour':
		// 		val = (val < 10 ? '0'+val : val);
		// 		break;
		// 	case 'minute':
		// 		val = (val < 10 ? '0'+val : val);
		// 		break;
		// 	default:
		// 
		// }
		var val = (!e.target ? e : e.target.value);
		self[which] = val;
		if (which === 'pm') {
			if (val) {
				self.am = false;
			} else {
				self.am = true;
			}
		}
		var d = new Date().getDate();
		var h = new Date().getHours();
		var m = new Date().getMinutes();
		var year = (!self.year ? new Date().getFullYear() : self.year);
		var month = (!self.month ? new Date().getMonth() : self.month);
		var day = (!self.day ? d : self.day);
		var hour = (!self.hour ? h : self.hour);
		if (self.pm) {
			hour = (hour + 12 >= 24 ? 0 : hour+12)
		}
		var minute = (!self.minute ? 0 : self.minute);
		console.log(moment({ 
			y:year,
			M:month,
			d:day,
			h:hour,
			m:minute,
			s:0,
			ms:0
		}).utc().format())
		self.date = moment({ 
			y:year,
			M:month,
			d:day,
			h:hour,
			m:minute,
			s:0,
			ms:0
		}).utc().format();
	},
	getYrs: function() {
		var thisYear = new Date().getFullYear();
		var nextYear = thisYear++;
		return [thisYear, nextYear];
	},
	getMos: function() {
		var self = this;
		var thisMonth = new Date().getMonth();
		console.log('month');
		console.log(thisMonth)
		var nextMonth = (thisMonth+1 > 11 ? 0 : thisMonth+1);
		var thirdMonth = (nextMonth + 1 > 11 ? 0 : nextMonth+1); 
		return [thisMonth, nextMonth, thirdMonth]//self.range(thisMonth, thirdMonth);
	},
	getDays: function() {
		var self = this;
		var thisMonth = new Date().getMonth();
		var mo = (!self.month ? thisMonth : self.month);
		var splitDays = (mo === thisMonth);
		var day = (!self.day ? new Date().getDate() : self.day);
		var days = (self.twentyeight !== undefined && self.twentyeight.indexOf(mo) !== -1 ? self.range(1,28) : (self.twentyeight !== undefined && self.thirty !== undefined && self.thirty.indexOf(mo) !== -1 ? self.range(1,30) : self.range(1,31)));
		if (splitDays) {
			days = days.slice(days.indexOf(day))
		}
		return days;

	},
	getHrs: function() {
		var self = this;
		var hours = self.range(1,12);
		var hr = new Date().getHours();
		console.log(hr)
		if (hr > 12) {
			hr = hr - 12;
			self.pm = true;
			self.am = false;
		} else {
			self.pm = false;
			self.am = true;
		}
		var day = (!self.day ? new Date().getDate() : self.day);
		console.log(self.day, new Date().getDate())
		if (day === new Date().getDate() && self.pm) {
			hours = hours.slice(hours.indexOf(hr))
		}
		return hours;
	},
	getMins: function() {
		var self = this;
		var minutes = [];
		var hour = (!self.hour ? new Date().getHours() : self.hour);
		var day = (!self.day ? new Date().getDate() : self.day)
		if (hour === new Date().getHours() && day === new Date().getDate()) {
			var nowMins = new Date().getMinutes();
			if (nowMins >= 30) {
				minutes = [0,30]
			} else {
				minutes = [0,30]
			}
		} else {
			minutes = [0,30]
		}
		return minutes
	},
	range: function(s,e) {
		var range = [];
		for (var i = s; i <= e; i++) {
			range.push(i)
		}
		return range;
	}

}