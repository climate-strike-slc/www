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
	activate: function(k) {
		// logic for when a div is active (mouseover, touchstart)
		this.active = k;
	},
	deactivate: function(k) {
		// (mouseleave, touchend)
		if (k !== this.active) {
			// this.hov = null;
			this.active = null;
			router.push({ path: '' });
		}
	},
	dialog: function(k, i) {
		router.push({ path: `#${k}` });
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
	}
}