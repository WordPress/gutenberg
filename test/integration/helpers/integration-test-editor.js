/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockInspector,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';
import {
	createBlock,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';
import {
	store as richTextStore,
	unregisterFormatType,
} from '@wordpress/rich-text';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { waitForStoreResolvers } from './wait-for-store-resolvers';
import { unlock } from '../../../packages/block-library/src/lock-unlock';

const { ExperimentalBlockCanvas: BlockCanvas } = unlock(
	blockEditorPrivateApis
);

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
 * @param {string} name
 */
export async function selectBlock( name ) {
	await userEvent.click( screen.getByLabelText( name ) );
}

export function Editor( { testBlocks, settings = {} } ) {
	const [ currentBlocks, updateBlocks ] = useState( testBlocks );
	const { getFormatTypes } = useSelect( richTextStore );

	useEffect( () => {
		return () => {
			getBlockTypes().forEach( ( { name } ) =>
				unregisterBlockType( name )
			);
			getFormatTypes().forEach( ( { name } ) =>
				unregisterFormatType( name )
			);
		};
	}, [ getFormatTypes ] );

	return (
		<BlockEditorProvider
			value={ currentBlocks }
			onInput={ updateBlocks }
			onChange={ updateBlocks }
			settings={ settings }
		>
			<BlockInspector />
			<BlockCanvas height="100%" shouldIframe={ false } />
		</BlockEditorProvider>
	);
}

/**
 * Registers the core block, creates the test block instances, and then instantiates the Editor.
 *
 * @param {Object | Array} testBlocks    Block or array of block settings for blocks to be tested.
 * @param {boolean}        useCoreBlocks Defaults to true. If false, core blocks will not be registered.
 * @param {Object}         settings      Any additional editor settings to be passed to the editor.
 */
export async function initializeEditor(
	testBlocks,
	useCoreBlocks = true,
	settings
) {
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
		return render(
			<Editor testBlocks={ newBlocks } settings={ settings } />
		);
	} );
}
