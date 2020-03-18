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
		this.hov = k;
	},
	deactivate: function(k) {
		// (mouseleave, touchend)
		router.push({ path: '' });
	},
	dialog: function(k) {
		router.push({ path: `#${k}` });
	}
}