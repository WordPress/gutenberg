/**
 * Tests control.js
 */

/**
 * External Dependencies
 */
const assert = require( 'assert' )

/**
 * Internal Dependencies
 */
const control = require( '../src/api/control' )

describe( 'control()', () => {
	it( 'should hold properties of the control', () => {
		let properties = {
			type: 'wp-text'
		}

		let expected = 'wp-text'
		let actual = control( properties ).type

		assert.equal( actual, expected )
	} )
	it( 'should still be a function', () => {
		let properties = {
			type: 'wp-text'
		}
		let textBlock = control( properties )

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
		let textBlock = control( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = control( textBlock, quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = control( textBlock, quoteProperties ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should work', () => {
		let textcontrol = {
			type: 'wp-text'
		}
		let quotecontrol = {
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

		let textBlockcontrol = control( textProperties )

		let actual = textBlockcontrol.type
		let expected = 'wp-text'

		assert.equal( actual, expected )

		actual = textBlockcontrol.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		assert.deepEqual( actual, expected )

		let quoteBlockcontrol = control( textBlockcontrol )( quotecontrol )( quoteProperties )( textcontrol )

		actual = quoteBlockcontrol.type
		expected = 'wp-text'

		assert.equal( actual, expected )

		actual = quoteBlockcontrol.controls
		expected = [
			'newControls'
		]

		assert.deepEqual( actual, expected )

		let anotherQuoteBlockcontrol = control( textBlockcontrol, quotecontrol )

		actual = anotherQuoteBlockcontrol.type
		expected = 'wp-quote'

		assert.equal( actual, expected )

		actual = anotherQuoteBlockcontrol.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		let oneMoreQuoteBlockcontrol = control( textBlockcontrol, quotecontrol )( quoteProperties, textcontrol )

		expected = quoteBlockcontrol.type
		actual = oneMoreQuoteBlockcontrol.type

		assert.equal( actual, expected )

		expected = quoteBlockcontrol.controls
		actual = oneMoreQuoteBlockcontrol.controls

		assert.equal( actual, expected )
	} )
	it( 'should be curryable', () => {
		let textcontrol = {
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
		let textBlock = control( textProperties )

		let expected = 'wp-text'
		let actual = control( textBlock )( quoteProperties )( textcontrol ).type

		assert.equal( actual, expected )

		expected = [ 'newControls' ]
		actual = control( textBlock )( quoteProperties )( textcontrol ).controls

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
		let textBlock = control( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = control( textBlock )( quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = control( textBlock )( quoteProperties ).controls

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
		let textBlock = control( textProperties )

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
		let textBlock = control( textProperties )

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
		let textBlock = control( textProperties )

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
		const textBlock = control( textProperties )

		const textBlock2 = control( textProperties )
		textBlock2.type = 'overriden'

		let expected = textBlock.type
		let actual = textBlock2.type

		assert.notEqual( actual, expected )
	} )
} )
