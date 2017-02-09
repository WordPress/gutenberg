/**
 * blockType.js serves as an API for creating block types.
 *
 * A blockType type defines the properties of a block. A text block
 * type could then be used to create an actual text block.
 */
( function() {
	function blockType( properties ) {
		if ( arguments.length > 1 ) {
			let properties = Object.assign( ...arguments )
		}

		var clone = cloner( blockType )( properties )

		return cloner( clone )
	}

	var cloner = function( primitiveFunction ) {
		var clone = function blockType( properties ) {
			if ( arguments.length > 1 ) {
				let properties = Object.assign( ...arguments )
			}
			return cloner( Object.assign( clone, properties ) )
		}

		return Object.assign( clone, primitiveFunction )
	}

	if ( typeof window !== 'undefined' ) {
		window.blockType = blockType
	}

	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		module.exports = blockType
	}
} () )
