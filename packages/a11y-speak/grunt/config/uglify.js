// See: https://github.com/gruntjs/grunt-contrib-uglify.
module.exports = {
	"a11y-speak": {
		options: {
			comments: "some",
			report: "gzip"
		},
		files: {
			"a11y-speak.min.js": [
				"a11y-speak.js"
			]
		}
	}
};
