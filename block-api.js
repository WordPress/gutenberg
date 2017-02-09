/**
 * block-api.js provides an interface for managing content blocks.
 */

/**
 * gutenberg is the top level namespace for housing the block API.
 */
var gutenberg = function() {
	var control = function( config ) {
		if ( typeof config === 'undefined' ) {
			return {}
		}

		return {
			name: config.name,
			type: config.type,
			displayArea: config.displayArea
		}
	}

	var block = function( config ) {
		if ( typeof config === 'undefined' ) {
			return {}
		}

		return {
			name: config.name,
			type: config.type,
			controls: config.controls
		}
	}

	// Standard text block.
	var textBlock = function( config ) {
		if ( typeof config === 'undefined' ) {
			config = {}
		}

		return Object.assign(
			{},
			config,
			block( {
				name: 'Text',
				type: 'wp-text',
				controls: [
					gutenberg().control(
						{
							name: 'Align Left',
							type: 'left-align',
							displayArea: 'block'
						}
					),
					gutenberg().control(
						{
							name: 'Align Center',
							type: 'center-align',
							displayArea: 'block'
						}
					),
					gutenberg().control(
						{
							name: 'Align Right',
							type: 'right-align',
							displayArea: 'block'
						}
					),
					gutenberg().control(
						{
							name: 'Make Text Bold',
							type: 'bold',
							displayArea: 'inline'
						}
					),
					gutenberg().control(
						{
							name: 'Italicize Text',
							type: 'italics',
							displayArea: 'inline'
						}
					),
					gutenberg().control(
						{
							name: 'Add A Link',
							type: 'link',
							displayArea: 'inline'
						}
					),
					gutenberg().control(
						{
							name: 'Strikethrough Text',
							type: 'strikethrough',
							displayArea: 'inline'
						}
					),
					gutenberg().control(
						{
							name: 'Underline Text',
							type: 'underline',
							displayArea: 'inline'
						}
					)
				]
			} )
		)
	}

	/**
	 * The blocks registry serves as an interface for de/registering blocks.
	 *
	 * For each instance of gutenberg() there will be one instance of the
	 * blocksRegistry. gutenberg().blocks is equivalent to the invocation of the
	 * blocksRegistry.
	 */
	var blocksRegistry = function() {
		var registeredBlocks = []

		var register = function( block ) {
			var blockExists = registeredBlocks.find( function( registeredBlock ) {
				return registeredBlock.type === block.type
			} )

			/**
			 * If the block does not exist add it to the registered blocks.
			 *
			 * If it does exist do nothing and return the already registered
			 * blocks, this can be changed to allow overriding.
			 */
			if ( typeof blockExists === 'undefined' ) {
				registeredBlocks.push( block )
				return [ block ];
			}

			return []
		}

		var registerBlock = function( block ) {
			// Return the list of blocks with the new block if it was added.
			var blocks = Array.prototype.concat.apply( [], registeredBlocks, register( block ) )

			return Blocks( blocks )
		}

		var registerBlocks = function( blocks ) {
			// Return the list of blocks with the new blocks if they were added.
			var blocks = Array.prototype.concat.apply( [], registeredBlocks, blocks.map( register ) )

			return Blocks( blocks )
		}

		var unregister = function( block ) {
			var blockIndex = registeredBlocks.findIndex( function( registeredBlock ) {
				return registeredBlock.type === block.type
			} )

			/**
			 * If the block does not exist remove it from the registered blocks.
			 *
			 * If it does exist do nothing and return the already registered
			 * blocks, this can be changed to allow overriding.
			 */
			if ( blockIndex !== -1 ) {
				delete registeredBlocks[ blockIndex ]
			}

			return registeredBlocks
		}

		var unregisterBlock = function( block ) {
			return Blocks( unregister( block ) )
		}

		var unregisterBlocks = function( blocks ) {
			var blocks = Array.prototype.concat.apply( [], blocks.map( unregister ) )
			return Blocks( blocks )
		}

		/**
		 * Add the interface to blocks.
		 *
		 * It is important to understand that even though it will act like an
		 * array it is not an Array, so when array methods are used they will
		 * return an Array type, and must be wrapped in Blocks() if you need to
		 * chain methods specific to a collection of the registered blocks.
		 *
		 * @param {array} blocks List of blocks.
		 * @returns {Blocks} List of blocks with additional interface.
		 */
		var Blocks = function( blocks ) {
			blocks.registerBlock = registerBlock
			blocks.registerBlocks = registerBlocks
			blocks.unregisterBlock = unregisterBlock
			blocks.unregisterBlocks = unregisterBlocks

			return blocks
		}

		/**
		 * The blocks property becomes an invocation of Blocks on a copy of the
		 * list of registered blocks.
		 */
		var blocks = Blocks( registeredBlocks.slice( 0 ) )

		return blocks
	}

	var blocks = blocksRegistry()

	return {
		block: block,
		control: control,
		textBlock: textBlock,
		blocks: blocks
	}
}

if ( typeof module !== 'undefined' ) {
	module.exports = gutenberg
}

/**
 * Object assign polyfill per MDN for IE support.
 *
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign
 */
if ( typeof Object.assign !== 'function' ) {
	Object.assign = function( target, varArgs ) { // .length of function is 2
		'use strict';

		if ( target == null ) { // TypeError if undefined or null
			throw new TypeError( 'Cannot convert undefined or null to object' );
		}

		var to = Object( target );

		for ( var index = 1; index < arguments.length; index++ ) {
			var nextSource = arguments[ index ];

			if ( nextSource != null ) { // Skip over if undefined or null
				for ( var nextKey in nextSource ) {
					// Avoid bugs when hasOwnProperty is shadowed
					if ( Object.prototype.hasOwnProperty.call( nextSource, nextKey ) ) {
						to[ nextKey ] = nextSource[ nextKey ];
					}
				}
			}
		}
		return to;
	};
}
