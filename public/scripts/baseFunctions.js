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
	}
}