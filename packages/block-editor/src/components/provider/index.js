/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect, useLayoutEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import useBlockSync from './use-block-sync';
import { store as blockEditorStore } from '../../store';
import { BlockRefsProvider } from './block-refs-provider';

/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */

function BlockEditorProvider( props ) {
	const { children, settings, value: controlledBlocks } = props;

	const { updateSettings, validateBlocksToTemplate } = useDispatch(
		blockEditorStore
	);

	useEffect( () => {
		updateSettings( settings );
	}, [ settings ] );

	useLayoutEffect( () => {
		if ( controlledBlocks ) {
			validateBlocksToTemplate( controlledBlocks );
		}
	}, [ settings ] );

	// Syncs the entity provider with changes in the block-editor store.
	useBlockSync( props );

	return <BlockRefsProvider>{ children }</BlockRefsProvider>;
}

export default withRegistryProvider( BlockEditorProvider );
