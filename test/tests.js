/**
 * Test the blocks API.
 */
const gutenberg = require( '../block-api.js' )
const assert = require( 'assert' )
const textBlock = require( '../wp-text.js' )

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
				render: undefined,
				icon: undefined,
				handlers: undefined
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

	/**
	 * textBlock will be deleted soon.
	 */
	describe( 'gutenberg.textBlock', function() {
		it( 'should return a text block with matching properties.', function() {
			let Gutenberg = gutenberg()

			let expected = {
				name: 'Text',
				type: 'wp-text',
				controls: []
			}

			// Override controls so function calls do not have to match.
			textBlock.controls = [];
			let actual = textBlock

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlock', function() {
		it( 'should return a list of registered blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ textBlock ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( textBlock ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should not allow blocks of the same type to exist.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ textBlock ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( textBlock ).registerBlock( textBlock ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should have two blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let expected = [ textBlock, Gutenberg.block( { type: 'yolo' } ) ]
			// Blocks() is a monad that sprinkles on some extra methods. Just compare the arrays.
			let actual = blocks.registerBlock( textBlock ).registerBlock( Gutenberg.block( { type: 'yolo' } ) ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlocks', function() {
		it( 'should allow the registry of multiple blocks.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let imageBlock = Object.assign( {}, textBlock );
			imageBlock.type = 'wp-image'

			let expected = [ textBlock, imageBlock ]
			let actual = blocks.registerBlocks( expected ).slice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.registerBlocks.registerBlock', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = Gutenberg.block( { type: 'yolo' } )
			let someBlocks = [ textBlock, Gutenberg.block( { type: 'image' } ) ]

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
			let someBlocks = [ textBlock ]

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

			let someBlock = textBlock
			blocks.registerBlock( someBlock )

			// Look for the empty list.
			let expected = []
			let actual = blocks.unregisterBlock( someBlock ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )

		it( 'should do nothing if the blocks do not exist.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlock = textBlock
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

			let someBlocks = [ textBlock, Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]
			let someBlocksToTakeAway = [ Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]

			// Look for partial list.
			let expected = []
			let actual = blocks.unregisterBlocks( someBlocksToTakeAway ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.blocks.unregisterBlocks', function() {
		it( 'should allow the registry of multiple blocks in a chain.', function() {
			let Gutenberg = gutenberg()
			let blocks = Gutenberg.blocks

			let someBlocks = [ textBlock, Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]
			let someBlocksToTakeAway = [ Gutenberg.block( { type: 'yolo' } ), Gutenberg.block( { type: 'image' } ) ]

			// Look for partial list.
			let expected = []
			let actual = blocks.unregisterBlocks( someBlocksToTakeAway ).splice( 0 )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.editor.getControls', function() {
		it( 'should grab controls.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.

			let someBlocks = [ textBlock ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = textBlock.controls.filter( control => control.displayArea === 'block' )
			let actual = editor.getControls( 'block' )( 'wp-text' )

			assert.deepEqual( actual, expected )
		} )
		it( 'should return empty when no blocks are present.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let someBlocks = []
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = []
			let actual = editor.getControls( 'block' )( 'wp-text' )

			assert.deepEqual( actual, expected )
		} )
		it( 'should return empty when no controls are present.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let aBlockWithoutControls = Gutenberg.block( { type: 'no-controls' } )
			let someBlocks = [ aBlockWithoutControls ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = []
			let actual = editor.getControls( 'block' )( 'no-controls' )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.editor.getBlockControls', function() {
		it( 'should grab controls.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let someBlocks = [ textBlock ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = textBlock.controls.filter( control => control.displayArea === 'block' )
			let actual = editor.getBlockControls( 'wp-text' )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.editor.getInlineControls', function() {
		it( 'should grab controls.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let someBlocks = [ textBlock ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = textBlock.controls.filter( control => control.displayArea === 'inline' )
			let actual = editor.getInlineControls( 'wp-text' )

			assert.deepEqual( actual, expected )
		} )
	} )

	describe( 'gutenberg.editor.renderControl', function() {
		it( 'should apply the callback for control.render().', function() {
			let Gutenberg = gutenberg()

			// Register blocks.

			let render = function( control ) {
				return control
			}
			let someBlocks = [ textBlock ]
			let editor = Gutenberg.editor( someBlocks )

			// Override the textBlock controls.
			textBlock.controls.push( { type: 'yolo' } )
			let index = textBlock.controls.findIndex( control => 'yolo' === control.type )
			let yoloControl = textBlock.controls[ index ]
			yoloControl.render = render

			// Look for partial list.
			let expected = { type: 'yolo', render }
			let actual = editor.renderControl( yoloControl )

			assert.deepEqual( actual, expected )
		} )

		it( 'should return null when control is not defined.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let aBlockWithoutControls = Gutenberg.block( { type: 'no-controls' } )
			let someBlocks = [ aBlockWithoutControls ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = null
			let actual = editor.renderControl( aBlockWithoutControls )

			assert.deepEqual( actual, expected )
		} )

		it( 'should return null when control.render() is not a function.', function() {
			let Gutenberg = gutenberg()

			// Register blocks.
			let controlWithoutRender = Gutenberg.control( { type: 'yolo' } )
			let aBlock = Gutenberg.block( {
				type: 'no-controls',
				controls: [ controlWithoutRender ]
			} )
			let someBlocks = [ aBlock ]
			let editor = Gutenberg.editor( someBlocks )

			// Look for partial list.
			let expected = null
			let actual = editor.renderControl( aBlock )

			assert.deepEqual( actual, expected )
		} )
	} )
} );
