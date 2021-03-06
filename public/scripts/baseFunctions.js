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
		if (self.years && self.years.length) {
			yearh = 1 / self.years.length;
			console.log(yearh)
			monthh = yearh / self.months.length;
			dayh = monthh / self.days.length;
		} else {
			yearh = 1;
			monthh = 1;
			dayh = 0.3;
		}
		var white, black, gray, darkgray, lightgray;
		if (self.darkmode) {
			white = '#fff';
			black = '#181818';
			darkgray = '#343536'
			gray = 'rgb(52, 53, 54)';
			lightgray = 'rgb(218, 220, 224)';
		} else {
			white = '#181818';
			black = '#fff';
			darkgray = 'rgb(218, 220, 224)'
			gray = 'rgb(52, 53, 54)';
			lightgray = '#343536';
		}
		$('#style').html(

			`:root {
				--yearh: ${yearh * 100}vh;
				--monthh: ${monthh * 100}vh;
				--dayh: ${dayh * 100}vh;
				--gutter: 12px;
				--thumbw: 42px;
				--white: ${white};
				--black: ${black};
				--gray: ${gray};
				--darkgray: ${darkgray};
				--lightgray: ${lightgray};
			}`
		)
	},
	activate: function(i) {
		var self = this;
		// logic for when a div is active (mouseover, touchstart)
		self.active = parseInt(i,10);

	},
	deactivate: function(i, e) {
		// (mouseleave, touchend)
		e.preventDefault()
		var self = this;
		if (self.active >= 0 && i) {
			if (parseInt(i, 10) !== this.active) {
				// this.hov = null;
				router.push({ path: '' });
			}
			self.active = null;
		} else if (self.active >= 0 && !i) {
			router.push({ path: '' });
			self.active = null;
		}
	},
	dialog: function(i, e) {
		e.preventDefault()
		var self = this;
		self.active = parseInt(i,10);
		router.push({ path: `/mtg/jitsi#meeting${i}` });
		const domain = 'bli.sh';
		// const roomName = moment(self.data[i].start_time).utc().format('LT') + ' ' + self.data[i].title
		const options = {
			roomName: self.data[i].topic,
			width: (!self.res ? (self.wWidth * 0.66) : (self.wWidth*0.86)) +'px',
			height: (!self.res ? ((self.wWidth * 0.66) * 0.72) : ((self.wWidth * 0.72) * 0.95)) +'px',
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
	},
	switchDarkmode: function() {
		var self = this;
		var darkmode = self.darkmode;
		self.darkmode = !darkmode; 
		self.appendStyleRoot()
	}
}