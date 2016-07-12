var containerPolite = null;
var containerAssertive = null;

/**
 * Build the live regions markup.
 *
 * @param {String} ariaLive Optional. Value for the "aria-live" attribute, default "polite".
 *
 * @returns {Object} $container The ARIA live region jQuery object.
 */
var addContainer = function( ariaLive ) {
	ariaLive = ariaLive || "polite";

	var container = document.createElement( "div" );
	container.id = "a11y-speak-" + ariaLive;
	container.className = "screen-reader-text a11y-speak-region";
	container.setAttribute( "aria-live", ariaLive );
	container.setAttribute( "aria-relevant", "additions text" );
	container.setAttribute( "aria-atomic", "true" );

	document.querySelector( "body" ).appendChild( container );
	return container;
};

/**
 * Clear the live regions.
 */
var clear = function() {
	var regions = document.querySelectorAll( ".a11y-speak-region" );
	for ( var i = 0; i < regions.length; i++ ) {
		regions[ i ].textContent = "";
	}
};

/**
 * Update the ARIA live notification area text node.
 *
 * @param {String} message  The message to be announced by Assistive Technologies.
 * @param {String} ariaLive Optional. The politeness level for aria-live. Possible values:
 *                          polite or assertive. Default polite.
 */
var A11ySpeak = function( message, ariaLive ) {
	if ( containerPolite === null ) {
		containerPolite = addContainer( "polite" );
	}

	if ( containerAssertive === null ) {
		containerAssertive = addContainer( "assertive" );
	}

	// Clear previous messages to allow repeated strings being read out.
	clear();

	if ( this.containerAssertive && "assertive" === ariaLive ) {
		this.containerAssertive.text( message );
	} else if ( this.containerPolite ) {
		this.containerPolite.text( message );
	}
};

module.exports = A11ySpeak;
