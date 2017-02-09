/**
 * block.js serves as an API for creating blocks.
 *
 * A block should provie a method/interface for creating some implementation
 * of itself. This could be DOM, or virtual DOM, TinyMCE, or anything you want.
 */
( function() {
	function block( properties ) {
		if ( arguments.length > 1 ) {
			let properties = Object.assign( ...arguments )
		}

		var clone = cloner( block )( properties )

		return cloner( clone )
	}

	var cloner = function( primitiveFunction ) {
		var clone = function block( properties ) {
			if ( arguments.length > 1 ) {
				let properties = Object.assign( ...arguments )
			}
			return cloner( Object.assign( clone, properties ) )
		}

		return Object.assign( clone, primitiveFunction )
	}

	if ( typeof window !== 'undefined' ) {
		window.block = block
	}

	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		module.exports = block
	}
} () )
