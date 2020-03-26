var baseFunctions = {
	parseObj: function(obj) {
		if (!obj) {
			return null;
		}
		return obj;
	},
	appendStyleRoot: function(){
		var self = this;
		$('#style').html(

			`:root {
				--gutter: 36px;
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
	}
}