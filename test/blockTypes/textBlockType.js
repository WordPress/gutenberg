/**
 * Tests block.js
 */

/**
 * External Dependencies
 */
const assert = require( 'assert' )

/**
 * Internal Dependencies
 */
const textType = require( '../../src/blockTypes/textType' )
const controlType = require( '../../src/api/controlType' )

describe( 'textType()', () => {
	it( 'should hold properties of the block type', () => {
		let properties = {
			type: 'wp-text',
			title: 'Paragraph',
			controls: [
				controlType( {
					type: 'left-align',
					title: 'Align Left',
					displayArea: 'block'
				} ),
				controlType( {
					type: 'center-align',
					title: 'Center Align',
					displayArea: 'block'
				} ),
				controlType( {
					type: 'right-align',
					title: 'Align Right',
					displayArea: 'block'
				} ),
				controlType( {
					type: 'bold',
					title: 'Make Bold',
					displayArea: 'inline'
				} ),
				controlType( {
					type: 'italics',
					title: 'Italicize',
					displayArea: 'inline'
				} ),
				controlType( {
					type: 'strikethrough',
					title: 'Strikethrough',
					displayArea: 'inline'
				} ),
				controlType( {
					type: 'underline',
					title: 'Underline',
					displayArea: 'inline'
				} )
			]
		}

		let obj = {}
		for ( var key in textType ) {
			if ( textType.hasOwnProperty( key ) ) {
				obj[ key ] = textType[ key ]
			}
		}

		let expected = properties.type
		let actual = obj.type

		assert.equal( actual, expected )
	} )
} )
