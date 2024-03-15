/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	store as blockEditorStore,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';
import { isOverridableBlock } from '../api';

const { BlockQuickNavigation } = unlock( blockEditorPrivateApis );

export default function PatternSchemaQuickNavigation() {
	const allClientIds = useSelect(
		( select ) =>
			unlock( select( blockEditorStore ) ).getClientIdsWithDescendants(),
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
	return <BlockQuickNavigation clientIds={ clientIdsWithOverrides } />;
}
