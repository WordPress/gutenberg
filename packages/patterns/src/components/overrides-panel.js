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
	const allClientIds = useSelect(
		( select ) => select( blockEditorStore ).getClientIdsWithDescendants(),
		[]
	);
	const { getBlock } = useSelect( blockEditorStore );
	const clientIdsWithOverrides = useMemo(
		() =>
			allClientIds.filter( ( clientId ) => {
				const block = getBlock( clientId );
				return isOverridableBlock( block );
			} ),
		[ allClientIds, getBlock ]
	);

	if ( ! clientIdsWithOverrides?.length ) {
		return null;
	}

	return (
		<PanelBody title={ __( 'Overrides' ) }>
			<BlockQuickNavigation clientIds={ clientIdsWithOverrides } />
		</PanelBody>
	);
}
