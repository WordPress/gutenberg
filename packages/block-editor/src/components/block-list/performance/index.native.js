/**
 * External dependencies
 */
import {
	fireEvent,
	getBlock,
	measurePerformance,
	render,
	screen,
	triggerBlockListLayout,
	setupCoreBlocks,
} from 'test/helpers';

/**
 * WordPress dependencies
 */
import { BlockEditorProvider } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import BlockList from '../index';

const createWrapper = ( testBlocks ) =>
	function Editor( { children } ) {
		return (
			<BlockEditorProvider value={ testBlocks }>
				{ children }
			</BlockEditorProvider>
		);
	};

describe( 'BlockList performance', () => {
	setupCoreBlocks( [ 'core/group' ] );

	it( 'should be stable', async () => {
		const newBlock = createBlock( 'core/group', {} );

		const scenario = async () => {
			await triggerBlockListLayout();
			screen.debug();
			// const groupBlock = getBlock( screen, 'Group' );
			// fireEvent.press( groupBlock );
			// await triggerBlockListLayout( groupBlock );
			// screen.debug();
		};

		// render( <Editor testBlocks={ [ newBlock ] } /> );
		await measurePerformance( <BlockList />, {
			runs: 1,
			scenario,
			verbose: true,
			wrapper: createWrapper( [ newBlock ] ),
		} );
	} );
} );
