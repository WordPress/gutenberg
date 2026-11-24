// Features that are always polyfilled, even when all the supported browsers
// implement them natively.
module.exports = [
	// Widely used in WordPress code, but only supported since Chrome 110,
	// Firefox 115 and Safari 16, so still missing in older browsers in use.
	'es.array.to-sorted',
];
