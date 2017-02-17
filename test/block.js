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
const block = require( '../src/api/block' )

describe( 'block()', () => {
	it( 'should hold properties of the block', () => {
		let properties = {
			type: 'wp-text'
		}

		let expected = 'wp-text'
		let actual = block( properties ).type

		assert.equal( actual, expected )
	} )
	it( 'should still be a function', () => {
		let properties = {
			type: 'wp-text'
		}
		let textBlock = block( properties )

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
		let textBlock = block( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = block( textBlock, quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = block( textBlock, quoteProperties ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should work', () => {
		let textblock = {
			type: 'wp-text'
		}
		let quoteblock = {
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

		let textBlockblock = block( textProperties )

		let actual = textBlockblock.type
		let expected = 'wp-text'

		assert.equal( actual, expected )

		actual = textBlockblock.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		assert.deepEqual( actual, expected )

		let quoteBlockblock = block( textBlockblock )( quoteblock )( quoteProperties )( textblock )

		actual = quoteBlockblock.type
		expected = 'wp-text'

		assert.equal( actual, expected )

		actual = quoteBlockblock.controls
		expected = [
			'newControls'
		]

		assert.deepEqual( actual, expected )

		let anotherQuoteBlockblock = block( textBlockblock, quoteblock )

		actual = anotherQuoteBlockblock.type
		expected = 'wp-quote'

		assert.equal( actual, expected )

		actual = anotherQuoteBlockblock.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		let oneMoreQuoteBlockblock = block( textBlockblock, quoteblock )( quoteProperties, textblock )

		expected = quoteBlockblock.type
		actual = oneMoreQuoteBlockblock.type

		assert.equal( actual, expected )

		expected = quoteBlockblock.controls
		actual = oneMoreQuoteBlockblock.controls

		assert.equal( actual, expected )
	} )
	it( 'should be curryable', () => {
		let textblock = {
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
		let textBlock = block( textProperties )

		let expected = 'wp-text'
		let actual = block( textBlock )( quoteProperties )( textblock ).type

		assert.equal( actual, expected )

		expected = [ 'newControls' ]
		actual = block( textBlock )( quoteProperties )( textblock ).controls

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
		let textBlock = block( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = block( textBlock )( quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = block( textBlock )( quoteProperties ).controls

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
		let textBlock = block( textProperties )

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
		let textBlock = block( textProperties )

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
		let textBlock = block( textProperties )

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
		const textBlock = block( textProperties )

		const textBlock2 = block( textProperties )
		textBlock2.type = 'overriden'

		let expected = textBlock.type
		let actual = textBlock2.type

		assert.notEqual( actual, expected )
	} )
} )
