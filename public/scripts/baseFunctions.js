var baseFunctions = {
	parseObj: function(obj) {
		if (!obj) {
			return null;
		}
		return obj;
	},
	appendStyleRoot: function(){
		var self = this;
		var yearh, monthh, dayh;
		if (self.years.length) {
			yearh = 1 / self.years.length;
			console.log(yearh)
			monthh = yearh / self.months.length;
			dayh = monthh / self.days.length;
		} else {
			yearh = 1;
			monthh = 1;
			dayh = 0.3;
		}
		$('#style').html(

			`:root {
				--yearh: ${yearh * 100}vh;
				--monthh: ${monthh * 100}vh;
				--dayh: ${dayh * 100}vh;
				--gutter: 42px;
				--thumbw: 42px;
			}`
		)
	},
	activate: function(i) {
		// logic for when a div is active (mouseover, touchstart)
		this.active = parseInt(i,10);
	},
	deactivate: function(i) {
		// (mouseleave, touchend)
		
		if (parseInt(i, 10) !== this.active) {
			// this.hov = null;
			router.push({ path: '' });
		}
		this.active = null;
	},
	dialog: function(i) {
		router.push({ path: `#${i}` });
	},
	hover: function() {
		// setTimeout(function(){
			this.hov = true;
		// },1000)
	},
	unhover: function() {
		// setTimeout(function(){
			this.hov = false;
		// },1000)
	},
	userBase64: function() {
		var self = this;
		var user = (!self.userName || self.userName === '' ? '' : new Buffer.from(self.userName).toString('base64'));
		return user;
	},
	drop: function(e) {
		var dropped = this.dropped;
		this.dropped = !dropped;
	},
	handleResize: function() {
		var self = this;
		self.wWidth = window.innerWidth;
		self.wHeight = window.innerHeight;
		self.res = self.wWidth < 600;
	},
	formatDate: function(which, date) {
		var self = this;
		var d;
		switch(which) {
			case 'year':
				d = new Date(date).getFullYear()
				break;
			case 'month':
				d = new Date(date).getMonth()
				break;
			case 'day':
				d = new Date(date).getDate()
				break;
			case 'hour':
				d = new Date(date).getHours()
				break;
			case 'minute':
				d = new Date(date).getMinutes()
				break;
			default:
				d = null;
		}
		return d;
	},
	getDataDates: function(which) {
		var self = this;
		var years = (!self.data ? [] : self.data.map(function(doc){
			return self.formatDate(which, doc.start_time);
		})).filter(function(v,i,a){return a.indexOf(v) === i})
		return years;
	}
}