/**
 * Tests blockType.js
 */

/**
 * External Dependencies
 */
const assert = require( 'assert' )

/**
 * Internal Dependencies
 */
const blockType = require( '../src/api/blockType' )

describe( 'blockType()', () => {
	it( 'should hold properties of the blockType', () => {
		let properties = {
			type: 'wp-text'
		}

		let expected = 'wp-text'
		let actual = blockType( properties ).type

		assert.equal( actual, expected )
	} )
	it( 'should still be a function', () => {
		let properties = {
			type: 'wp-text'
		}
		let textBlock = blockType( properties )

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
		let textBlock = blockType( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = blockType( textBlock, quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = blockType( textBlock, quoteProperties ).controls

		assert.deepEqual( actual, expected )
	} )
	it( 'should work', () => {
		let textType = {
			type: 'wp-text'
		}
		let quoteType = {
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

		let textBlockType = blockType( textProperties )

		let actual = textBlockType.type
		let expected = 'wp-text'

		assert.equal( actual, expected )

		actual = textBlockType.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		assert.deepEqual( actual, expected )

		let quoteBlockType = blockType( textBlockType )( quoteType )( quoteProperties )( textType )

		actual = quoteBlockType.type
		expected = 'wp-text'

		assert.equal( actual, expected )

		actual = quoteBlockType.controls
		expected = [
			'newControls'
		]

		assert.deepEqual( actual, expected )

		let anotherQuoteBlockType = blockType( textBlockType, quoteType )

		actual = anotherQuoteBlockType.type
		expected = 'wp-quote'

		assert.equal( actual, expected )

		actual = anotherQuoteBlockType.controls
		expected = [
			'leftAlign',
			'rightAlign'
		]

		let oneMoreQuoteBlockType = blockType( textBlockType, quoteType )( quoteProperties, textType )

		expected = quoteBlockType.type
		actual = oneMoreQuoteBlockType.type

		assert.equal( actual, expected )

		expected = quoteBlockType.controls
		actual = oneMoreQuoteBlockType.controls

		assert.equal( actual, expected )
	} )
	it( 'should be curryable', () => {
		let textType = {
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
		let textBlock = blockType( textProperties )

		let expected = 'wp-text'
		let actual = blockType( textBlock )( quoteProperties )( textType ).type

		assert.equal( actual, expected )

		expected = [ 'newControls' ]
		actual = blockType( textBlock )( quoteProperties )( textType ).controls

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
		let textBlock = blockType( textProperties )

		let quoteProperties = {
			type: 'wp-quote'
		}

		let expected = 'wp-quote'
		let actual = blockType( textBlock )( quoteProperties ).type

		assert.equal( actual, expected )

		expected = [
			'leftAlign',
			'rightAlign'
		]
		actual = blockType( textBlock )( quoteProperties ).controls

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
		let textBlock = blockType( textProperties )

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
		let textBlock = blockType( textProperties )

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
		let textBlock = blockType( textProperties )

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
		const textBlock = blockType( textProperties )

		const textBlock2 = blockType( textProperties )
		textBlock2.type = 'overriden'

		let expected = textBlock.type
		let actual = textBlock2.type

		assert.notEqual( actual, expected )
	} )
} )
