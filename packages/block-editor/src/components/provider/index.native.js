/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import withRegistryProvider from './with-registry-provider';
import useBlockSync from './use-block-sync';
import { store as blockEditorStore } from '../../store';

/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */

function BlockEditorProvider( props ) {
	const { children, settings } = props;

	const { updateSettings } = useDispatch( blockEditorStore );
	useEffect( () => {
		updateSettings( settings );
	}, [ settings ] );

	// Syncs the entity provider with changes in the block-editor store.
	useBlockSync( props );

	return children;
}

export default withRegistryProvider( BlockEditorProvider );
