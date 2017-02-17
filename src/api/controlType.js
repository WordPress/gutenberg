/**
 * controlType.js serves as an API for creating control types.
 *
 * A controlType type defines the properties of a control. A left align control
 * type could then be used to create an actual left align control.
 */
( function() {
	function controlType( properties ) {
		if ( arguments.length > 1 ) {
			let properties = Object.assign( ...arguments )
		}

		var clone = cloner( controlType )( properties )

		return cloner( clone )
	}

	var cloner = function( primitiveFunction ) {
		var clone = function controlType( properties ) {
			if ( arguments.length > 1 ) {
				let properties = Object.assign( ...arguments )
			}
			return cloner( Object.assign( clone, properties ) )
		}

		return Object.assign( clone, primitiveFunction )
	}

	if ( typeof window !== 'undefined' ) {
		window.controlType = controlType
	}

	if ( typeof module !== 'undefined' && typeof module.exports !== 'undefined' ) {
		module.exports = controlType
	}
} () )
