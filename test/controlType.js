/**
 * Tests controlType.js
 */

/**
 * External Dependencies
 */
const assert = require( 'assert' )

/**
 * Internal Dependencies
 */
const controlType = require( '../src/api/controlType' )

describe( 'controlType()', () => {
	it( 'should hold properties of the controlType', () => {
		let properties = {
			type: 'wp-text'
		}

		let expected = 'wp-text'
		let actual = controlType( properties ).type

		assert.equal( actual, expected )
	} )
	it( 'should still be a function', () => {
		let properties = {
			type: 'wp-text'
		}
		let textBlock = controlType( properties )

		let expected = true
		let actual = typeof textBlock === 'function'

		assert.equal( actual, expected )
	} )
	it( 'should be composable', () => {
		let textProperties = {
			type: 'wp-text',
			controls: [
				'leftAlign',
				'rightAlign'
			]
		}
		let textBlock = controlType( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = controlType( textBlock, quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = controlType( textBlock, quoteProperties ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should work', () => {
		let textcontrolType = {
			type: 'wp-text'
		}
		let quotecontrolType = {
			type: 'wp-quote'
		}
		let textProperties = {
			type: 'wp-text',
			controls: [
				'leftAlign',
				'rightAlign'
			]
		}
		let quoteProperties = {
			type: 'wp-quote',
			controls: [
				'newControls'
			]
		}

		let textBlockcontrolType = controlType( textProperties )

		let actual = textBlockcontrolType.type
		let expected = 'wp-text'

		assert.equal( actual, expected )

		actual = textBlockcontrolType.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		assert.deepEqual( actual, expected )

		let quoteBlockcontrolType = controlType( textBlockcontrolType )( quotecontrolType )( quoteProperties )( textcontrolType )

		actual = quoteBlockcontrolType.type
		expected = 'wp-text'

		assert.equal( actual, expected )

		actual = quoteBlockcontrolType.controls
		expected = [
			'newControls'
		]

		assert.deepEqual( actual, expected )

		let anotherQuoteBlockcontrolType = controlType( textBlockcontrolType, quotecontrolType )

		actual = anotherQuoteBlockcontrolType.type
		expected = 'wp-quote'

		assert.equal( actual, expected )

		actual = anotherQuoteBlockcontrolType.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		let oneMoreQuoteBlockcontrolType = controlType( textBlockcontrolType, quotecontrolType )( quoteProperties, textcontrolType )

		expected = quoteBlockcontrolType.type
		actual = oneMoreQuoteBlockcontrolType.type

		assert.equal( actual, expected )

		expected = quoteBlockcontrolType.controls
		actual = oneMoreQuoteBlockcontrolType.controls

		assert.equal( actual, expected )
	} )
	it( 'should be curryable', () => {
		let textcontrolType = {
			type: 'wp-text'
		}
		let textProperties = {
			type: 'wp-text',
			controls: [
				'leftAlign',
				'rightAlign'
			]
		}
		let quoteProperties = {
			type: 'wp-quote',
			controls: [
				'newControls'
			]
		}
		let textBlock = controlType( textProperties )

		let expected = 'wp-text'
		let actual = controlType( textBlock )( quoteProperties )( textcontrolType ).type

		assert.equal( actual, expected )

		expected = [ 'newControls' ]
		actual = controlType( textBlock )( quoteProperties )( textcontrolType ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should override properties in sequence', () => {
		let textProperties = {
			type: 'wp-text',
			controls: [
				'leftAlign',
				'rightAlign'
			]
		}
		let textBlock = controlType( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = controlType( textBlock )( quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = controlType( textBlock )( quoteProperties ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should be able to compose out of references.', () => {
		let textProperties = {
			type: 'wp-text',
			controls: [
				'leftAlign',
				'rightAlign'
			]
		}
		let textBlock = controlType( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = textBlock( quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = textBlock( quoteProperties ).controls
	} )
	it( 'should handle deep references.', () => {
		let textProperties = {
			type: 'wp-text',
			controls: [
				{
					name: 'I am control!',
					randomObject: {
						randomObject: {
							property: 'Hiding here.'
						}
					}
				}
			]
		}
		let textBlock = controlType( textProperties )

		let expected = [
			{
				name: 'I am control!',
				randomObject: {
					randomObject: {
						property: 'Hiding here.'
					}
				}
			}
		]
		let actual = textBlock.controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should return itself without passing properties when called.', function() {
		let textProperties = {
			type: 'wp-text',
			controls: [
				{
					name: 'I am control!',
					randomObject: {
						randomObject: {
							property: 'Hiding here.'
						}
					}
				}
			]
		}
		let textBlock = controlType( textProperties )

		let expected = textBlock.type
		let actual = textBlock().type

		assert.equal( actual, expected )
	} )
	it( 'should create new references.', () => {
		let textProperties = {
			type: 'wp-text',
			controls: [
				{
					name: 'I am control!',
					randomObject: {
						randomObject: {
							property: 'Hiding here.'
						}
					}
				}
			]
		}
		const textBlock = controlType( textProperties )

		const textBlock2 = controlType( textProperties )
		textBlock2.type = 'overriden'

		let expected = textBlock.type
		let actual = textBlock2.type

		assert.notEqual( actual, expected )
	} )
} )
