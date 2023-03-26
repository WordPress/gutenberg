/**
 * External dependencies
 */
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
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
 * Selects the block to be tested by the aria-label on the block wrapper, eg. "Block: Cover".
 *
 * @param {string}                                  name
 * @param {import('@testing-library/react').Screen} screen
 */
export async function selectBlock( name, screen ) {
	await userEvent.click( screen.getByLabelText( name ) );
}

export function Editor( { testBlocks, settings = {} } ) {
	const [ currentBlocks, updateBlocks ] = useState( testBlocks );

	useEffect( () => {
		return () => {
			getBlockTypes().forEach( ( { name } ) =>
				unregisterBlockType( name )
			);
		};
	}, [] );

	return (
		<ShortcutProvider>
			<SlotFillProvider>
				<BlockEditorProvider
					value={ currentBlocks }
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

export async function initializeEditor( {
	useCoreBlocks = true,
	testBlocks,
	...props
} ) {
	if ( useCoreBlocks ) {
		registerCoreBlocks();
	}
	const blocks = Array.isArray( testBlocks ) ? testBlocks : [ testBlocks ];
	const newBlocks = blocks.map( ( testBlock ) =>
		createBlock(
			testBlock.name,
			testBlock.attributes,
			testBlock.innerBlocks
		)
	);
	return waitForStoreResolvers( () => {
		return render( <Editor testBlocks={ newBlocks } { ...props } /> );
	} );
}
