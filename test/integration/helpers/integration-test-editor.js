/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockTools,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import { ShortcutProvider } from '@wordpress/keyboard-shortcuts';
import '@wordpress/format-library';
import {
	createBlock,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { waitForStoreResolvers } from './wait-for-store-resolvers';

// Polyfill for String.prototype.replaceAll until CI is runnig Node 15 or higher.
if ( ! String.prototype.replaceAll ) {
	String.prototype.replaceAll = function ( str, newStr ) {
		// If a regex pattern
		if (
			Object.prototype.toString.call( str ).toLowerCase() ===
			'[object regexp]'
		) {
			return this.replace( str, newStr );
		}

		// If a string
		return this.replace( new RegExp( str, 'g' ), newStr );
	};
}

/**
 * For registering all the core blocks if needed as part of test setup.
 */
export function registerAllCoreBlocks() {
	registerCoreBlocks();
}

/**
 * Unregisters all blocks if needed as part of test cleanup.
 */
export function unRegisterAllBlocks() {
	getBlockTypes().forEach( ( { name } ) => unregisterBlockType( name ) );
}

/**
 * Selects the block to be test by the aria-label on block wrapper, eg. "Block: Cover".
 *
 * @param {string}                                  name
 * @param {import('@testing-library/react').Screen} screen
 */
export async function selectBlock( name, screen ) {
	await userEvent.click( screen.getByLabelText( name ) );
}

/**
 * Creates the block to be tested.
 *
 * @param {string} name        Block name.
 * @param {Object} attributes  Block attributes.
 * @param {?Array} innerBlocks Nested blocks.
 *
 * @return {Object} Block object.
 */
export function createTestBlock( name, attributes = {}, innerBlocks = [] ) {
	return createBlock( name, attributes, innerBlocks );
}

export function Editor( { testBlocks, settings = {} } ) {
	const [ blocks, updateBlocks ] = useState( testBlocks );

	return (
		<ShortcutProvider>
			<SlotFillProvider>
				<BlockEditorProvider
					value={ blocks }
					onInput={ updateBlocks }
					onChange={ updateBlocks }
					settings={ settings }
				>
					<BlockInspector />
					<BlockTools>
						<BlockEditorKeyboardShortcuts.Register />
						<WritingFlow>
							<ObserveTyping>
								<BlockList />
							</ObserveTyping>
						</WritingFlow>
					</BlockTools>

					<Popover.Slot />
				</BlockEditorProvider>
			</SlotFillProvider>
		</ShortcutProvider>
	);
}

export async function initializeEditor( props ) {
	return waitForStoreResolvers( () => {
		return render( <Editor { ...props } /> );
	} );
}
