/**
 * Build the live regions markup.
 *
 * @param {String} ariaLive Optional. Value for the 'aria-live' attribute, default 'polite'.
 *
 * @returns {Object} $container The ARIA live region jQuery object.
 */
var addContainer = function addContainer(ariaLive) {
	ariaLive = ariaLive || 'polite';

	var container = document.createElement('div');
	container.id = 'a11y-speak-' + ariaLive;
	container.className = 'a11y-speak-region';

	var screenReaderTextStyle = 'clip: rect(1px, 1px, 1px, 1px); position: absolute; height: 1px; width: 1px; overflow: hidden; word-wrap: normal;';
	container.setAttribute('style', screenReaderTextStyle);
	container.setAttribute('aria-live', ariaLive);
	container.setAttribute('aria-relevant', 'additions text');
	container.setAttribute('aria-atomic', 'true');

	document.querySelector('body').appendChild(container);
	return container;
};

export default addContainer;