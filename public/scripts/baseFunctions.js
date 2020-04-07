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
		var self = this;
		// logic for when a div is active (mouseover, touchstart)
		self.active = parseInt(i,10);

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
		var self = this;
		self.active = parseInt(i,10);
		router.push({ path: `/jitsi#meeting${i}` });
		const domain = 'bli.sh';
		const options = {
			roomName: self.keys[i],
			width: (!self.res ? (self.wWidth * 0.66) : (self.wWidth*0.85)) +'px',
			height: (!self.res ? ((self.wWidth * 0.66) * 0.72) : (self.wWidth * 0.66)) +'px',
			parentNode: document.querySelector(`#meeting${i}`),
			// noSSL: false
		};
		self.apis[self.keys[i]] = new JitsiMeetExternalAPI(domain, options);
		var iframe = document.getElementById(`jitsiConferenceFrame${i}`)
		setTimeout(function(){
			iframe.style.position = 'absolute';
			iframe.style.top = '0'
			iframe.style.left = '0'
		}, 1000)
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
		// console.log(d)
		return d;
	},
	getDataDates: function(which) {
		var self = this;
		var years = (!self.data ? [] : self.data.map(function(doc){
			return self.formatDate(which, doc.start_time);
		})).filter(function(v,i,a){return a.indexOf(v) === i});
		console.log(years)
		return years;
	},
	checkAdmin: function(e) {
		var self = this;
		var valel = document.getElementById('checkAdmin');
		var val = valel.value;
		var valid = false;
		$.post('/checkAdmin/'+encodeURIComponent(val), function(valid){
			if (!valid) {
				valid = false;
			} else {
				valid = true;
			}
			self.adminValidated = valid;
		})//.test(val)
	},
	validateAdmin: function(e) {
		var self = this;
		var val = e.target.value;
		var valid = false;
		$.post('/checkAdmin/'+encodeURIComponent(val), function(valid){
			if (!valid) {
				valid = false;
			} else {
				valid = true;
			}
			self.adminValidated = valid;
		})//.test(val)
	}
}