/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import usePostContentBlocks from './use-post-content-blocks';

/**
 * Component that when rendered, makes it so that the site editor allows only
 * page content to be edited.
 */
export default function DisableNonPageContentBlocks() {
	const contentOnlyIds = usePostContentBlocks();
	const { templateParts, isNavigationMode } = useSelect( ( select ) => {
		const { getBlocksByName, isNavigationMode: _isNavigationMode } =
			select( blockEditorStore );
		return {
			templateParts: getBlocksByName( 'core/template-part' ),
			isNavigationMode: _isNavigationMode(),
		};
	}, [] );
	const disabledIds = useSelect(
		( select ) => {
			const { getBlockOrder } = select( blockEditorStore );
			return templateParts.flatMap( ( clientId ) =>
				getBlockOrder( clientId )
			);
		},
		[ templateParts ]
	);

	const registry = useRegistry();

	// The code here is split into multiple `useEffects` calls.
	// This is done to avoid setting/unsetting block editing modes multiple times unnecessarily.
	//
	// For example, the block editing mode of the root block (clientId: '') only
	// needs to be set once, not when `contentOnlyIds` or `disabledIds` change.
	//
	// It's also unlikely that these different types of blocks are being inserted
	// or removed at the same time, so using different effects reflects that.
	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		setBlockEditingMode( '', 'disabled' );

		return () => {
			unsetBlockEditingMode( '' );
		};
	}, [ registry ] );

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		registry.batch( () => {
			for ( const clientId of contentOnlyIds ) {
				setBlockEditingMode( clientId, 'contentOnly' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of contentOnlyIds ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ contentOnlyIds, registry ] );

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		registry.batch( () => {
			if ( ! isNavigationMode ) {
				for ( const clientId of templateParts ) {
					setBlockEditingMode( clientId, 'contentOnly' );
				}
			}
		} );

		return () => {
			registry.batch( () => {
				if ( ! isNavigationMode ) {
					for ( const clientId of templateParts ) {
						unsetBlockEditingMode( clientId );
					}
				}
			} );
		};
	}, [ templateParts, isNavigationMode, registry ] );

	useEffect( () => {
		const { setBlockEditingMode, unsetBlockEditingMode } =
			registry.dispatch( blockEditorStore );

		registry.batch( () => {
			for ( const clientId of disabledIds ) {
				setBlockEditingMode( clientId, 'disabled' );
			}
		} );

		return () => {
			registry.batch( () => {
				for ( const clientId of disabledIds ) {
					unsetBlockEditingMode( clientId );
				}
			} );
		};
	}, [ disabledIds, registry ] );

	return null;
}
