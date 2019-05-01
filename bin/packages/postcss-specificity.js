const postcss = require( 'postcss' );

module.exports = postcss.plugin( 'postcss-specificity', ( options ) => {
	const defaults = {

		// The wrapping selector we're working within.
		scopeTo: ':root',

		// Increase specificity by repeating the selector.
		repeat: 1,

		remove: [],

		replace: [],

		ignore: [],
	};

	const opts = { ...defaults, ...options };

	return ( root ) => {
		root.walkRules( ( rule ) => {
			rule.selectors = rule.selectors.map( ( selector ) => {
				// Get rid of the remove selectors.
				if ( -1 !== opts.remove.indexOf( selector ) ) {
					return rule.remove();
				}

				// Replace the replace selector with scopeTo.
				if ( -1 !== opts.replace.indexOf( selector ) ) {
					return opts.scopeTo.repeat( opts.repeat );
				}

				// Skip the ignored selectors.
				if ( -1 !== opts.ignore.indexOf( selector ) ) {
					return selector;
				}

				// Ignore descendant rules of @keyframes {}.
				if ( rule.parent.type === 'atrule' && rule.parent.name === 'keyframes' ) {
					return selector;
				}

				// If its the scopeTo selector already, re-add with repeats.
				if ( -1 !== selector.indexOf( opts.scopeTo ) ) {
					return opts.scopeTo.repeat( opts.repeat );
				}

				// For anything else add the scopeTo before the selector.
				return `${ opts.scopeTo.repeat( opts.repeat ) } ${ selector }`;
			} );
		} );
	};
} );
