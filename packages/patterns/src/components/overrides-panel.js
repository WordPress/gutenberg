/**
 * WordPress dependencies
 */
import {
	privateApis as blockEditorPrivateApis,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { isOverridableBlock } from '../api';
import { unlock } from '../lock-unlock';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

export default function OverridesPanel() {
	const { allClientIds, supportedBlockTypesRaw } = useSelect(
		( select ) => ( {
			allClientIds:
				select( blockEditorStore ).getClientIdsWithDescendants(),
			supportedBlockTypesRaw:
				select( blockEditorStore ).getSettings()
					?.__experimentalBlockBindingsSupportedAttributes,
		} ),
		[]
	);
	const { getBlock } = useSelect( blockEditorStore );
	const clientIdsWithOverrides = useMemo( () => {
		const supportedBlockTypes = Object.keys( supportedBlockTypesRaw ?? {} );
		return allClientIds.filter( ( clientId ) => {
			const block = getBlock( clientId );
			return (
				supportedBlockTypes.includes( block.name ) &&
				isOverridableBlock( block )
			);
		} );
	}, [ allClientIds, getBlock, supportedBlockTypesRaw ] );

	if ( ! clientIdsWithOverrides?.length ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Overrides' ) }>
			<BlockQuickNavigation clientIds={ clientIdsWithOverrides } />
		</PanelBody>
	);
}
