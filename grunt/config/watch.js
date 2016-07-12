// See: https://github.com/gruntjs/grunt-contrib-watch.
module.exports = {
	compile: {
		files: "<%= files.js %>",
		tasks: [ "build:js" ]
	},
	checks: {
		files: [ "<%= files.js %>" ],
		tasks: [ "eslint" ]
	}
};
