/**
 * Build the live regions markup.
 *
 * @param {String} ariaLive Optional. Value for the "aria-live" attribute, default "polite".
 *
 * @returns {Object} $container The ARIA live region jQuery object.
 */
const addContainer = function( ariaLive ) {
	ariaLive = ariaLive || "polite";

	let container = document.createElement( "div" );
	container.id = "a11y-speak-" + ariaLive;
	container.className = "a11y-speak-region";

	let screenReaderTextStyle = "clip: rect(1px, 1px, 1px, 1px); position: absolute; height: 1px; width: 1px; overflow: hidden; word-wrap: normal;";
	container.setAttribute( "style", screenReaderTextStyle );
	container.setAttribute( "aria-live", ariaLive );
	container.setAttribute( "aria-relevant", "additions text" );
	container.setAttribute( "aria-atomic", "true" );

	document.querySelector( "body" ).appendChild( container );
	return container;
};

export default addContainer;
