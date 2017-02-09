/**
 * Test the blocks API.
 */
const gutenberg = require( '../block-api.js' )
const assert = require( 'assert' )

describe( 'gutenberg()', function() {
	it( 'should return an object with the block api.', function() {
		let Gutenberg = gutenberg()

		let expected = 'function'
		let actual = typeof Gutenberg.block

		assert.equal( actual, expected )
	} );

	describe( 'gutenberg.control', function() {
		it( 'should return a control with matching properties.', function() {
			let Gutenberg = gutenberg()

			let expected = {
				name: 'Align Left',
				type: 'left-align',
				displayArea: 'block',
			}
			let actual = Gutenberg.control(
				{
					name: 'Align Left',
					type: 'left-align',
					displayArea: 'block',
				}
			)

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.block', function() {
		it( 'should return a block with matching properties.', function() {
			let Gutenberg = gutenberg()

			let expected = {
				name: 'Text',
				type: 'wp-text',
				controls: [
					{
						name: 'Align Left',
						type: 'left-align',
						handler: {}
					}
				]
			}
			let actual = Gutenberg.block(
				{
					name: 'Text',
					type: 'wp-text',
					controls: [
						{
							name: 'Align Left',
							type: 'left-align',
							handler: {}
						}
					]
				}
			)

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.textBlock', function() {
		it( 'should return a text block with matching properties.', function() {
			let Gutenberg = gutenberg()

			let expected = {
				name: 'Text',
				type: 'wp-text',
				controls: [
					{
						name: 'Align Left',
						type: 'left-align',
						displayArea: 'block'
					},
					{
						name: 'Align Center',
						type: 'center-align',
						displayArea: 'block'
					},
					{
						name: 'Align Right',
						type: 'right-align',
						displayArea: 'block'
					},
					{
						name: 'Make Text Bold',
						type: 'bold',
						displayArea: 'inline'
					},
					{
						name: 'Italicize Text',
						type: 'italics',
						displayArea: 'inline'
					},
					{
						name: 'Add A Link',
						type: 'link',
						displayArea: 'inline'
					},
					{
						name: 'Strikethrough Text',
						type: 'strikethrough',
						displayArea: 'inline'
					},
					{
						name: 'Underline Text',
						type: 'underline',
						displayArea: 'inline'
					}
				]
			}
			let actual = Gutenberg.textBlock()

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlock', function() {
		it( 'should return a list of registered blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ Gutenberg.textBlock() ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( Gutenberg.textBlock() ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should not allow blocks of the same type to exist.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ Gutenberg.textBlock() ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( Gutenberg.textBlock() ).registerBlock( Gutenberg.textBlock() ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should have two blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ Gutenberg.textBlock(), Gutenberg.block( { type: 'yolo' } ) ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( Gutenberg.textBlock() ).registerBlock( Gutenberg.block( { type: 'yolo' } ) ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlocks', function() {
		it( 'should allow the registry of multiple blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ Gutenberg.textBlock(), Gutenberg.block( { type: 'yolo' } ) ]
			let actual = blocks.registerBlocks( expected ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlocks.registerBlock', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = Gutenberg.block( { type: 'yolo' } )
			let someBlocks = [ Gutenberg.textBlock(), Gutenberg.block( { type: 'image' } ) ]

			// Look for the whole list.
			let expected = [].concat( someBlocks, [ someBlock ] )
			let actual = blocks.registerBlocks( someBlocks ).registerBlock( someBlock ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlock.registerBlocks', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = Gutenberg.block( { type: 'yolo' } )
			let someBlocks = [ Gutenberg.textBlock() ]

			// Look for the whole list.
			let expected = [].concat( someBlocks, [ someBlock ] )
			let actual = blocks.registerBlocks( someBlocks ).registerBlock( someBlock ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.unregisterBlock', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = Gutenberg.textBlock()

			blocks.registerBlock( someBlock )

			// Look for the empty list.
			let expected = []
			let actual = blocks.unregisterBlock( someBlock ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should do nothing if the blocks do not exist.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = Gutenberg.textBlock()
			let blockDoesNotExist = Gutenberg.block( { type: 'I do not exist' } )

			blocks.registerBlock( someBlock )

			// Look for the empty list.
			let expected = [ someBlock ]
			let actual = blocks.unregisterBlock( blockDoesNotExist ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.unregisterBlocks', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlocks = [ Gutenberg.textBlock(), Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]
			let someBlocksToTakeAway = [ Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]

			// Look for partial list.
			let expected = []
			let actual = blocks.unregisterBlocks( someBlocksToTakeAway ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )
} );
