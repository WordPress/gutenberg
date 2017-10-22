/**
 * Clear the a11y-speak-region elements.
 */
var clear = function clear() {
	var regions = document.querySelectorAll('.a11y-speak-region');
	for (var i = 0; i < regions.length; i++) {
		regions[i].textContent = '';
	}
};

export default clear;