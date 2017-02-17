/**
 * control.js serves as an API for creating controls.
 *
 * A control should provie a method/interface for creating some implementation
 * of itself. This could be DOM, or virtual DOM, TinyMCE, or anything you want.
 */
( function() {
	function control( properties ) {
		if ( arguments.length > 1 ) {
			let properties = Object.assign( ...arguments )
		}

		var clone = cloner( control )( properties )

		return cloner( clone )
	}

	var cloner = function( primitiveFunction ) {
		var clone = function control( properties ) {
			if ( arguments.length > 1 ) {
				let properties = Object.assign( ...arguments )
			}
			return cloner( Object.assign( clone, properties ) )
		}

		return Object.assign( clone, primitiveFunction )
	}

	if ( typeof window !== 'undefined' ) {
		window.control = control
	}

	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		module.exports = control
	}
} () )
