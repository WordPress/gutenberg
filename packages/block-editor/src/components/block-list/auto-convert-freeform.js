/**
 * WordPress dependencies
 */
import { useRegistry } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { rawHandler, serialize } from '@wordpress/blocks';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

export default function useAutoConvert() {
	const registry = useRegistry();
	useEffect( () => {
		const { getSettings, getBlockOrder, getBlockName, getBlock } =
			registry.select( blockEditorStore );
		const { autoConvertFreeform } = getSettings();

		if ( ! autoConvertFreeform ) {
			return;
		}

		const order = getBlockOrder( '' );

		if ( order.length !== 1 ) {
			return;
		}

		const [ clientId ] = order;
		const blockName = getBlockName( clientId );

		if ( blockName !== 'core/freeform' ) {
			return;
		}

		const block = getBlock( clientId );
		const newBlocks = rawHandler( { HTML: serialize( block ) } );
		const { replaceBlocks } = registry.dispatch( blockEditorStore );
		const { createSuccessNotice } = registry.dispatch( noticesStore );

		replaceBlocks( block.clientId, newBlocks );
		createSuccessNotice( __( 'Freeform content converted to blocks.' ), {
			type: 'snackbar',
			isDismissible: true,
			actions: [
				{
					label: __( 'Undo' ),
					onClick: () => {
						replaceBlocks(
							newBlocks.map( ( b ) => b.clientId ),
							[ block ]
						);
					},
				},
			],
		} );
	}, [ registry ] );
}
