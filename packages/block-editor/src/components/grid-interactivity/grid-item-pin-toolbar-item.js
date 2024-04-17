/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { pin as pinIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { getGridItemRect } from './utils';

export function GridItemPinToolbarItem( { clientId, layout, onChange } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}

	const isPinned = !! layout?.columnStart || !! layout?.rowStart;

	function unpinBlock() {
		onChange( {
			columnStart: undefined,
			rowStart: undefined,
		} );
	}

	function pinBlock() {
		const rect = getGridItemRect( blockElement );
		onChange( {
			columnStart: rect.columnStart,
			rowStart: rect.rowStart,
		} );
	}

	return (
		<BlockControls group="parent">
			<ToolbarButton
				icon={ pinIcon }
				label={
					isPinned ? __( 'Pinned to grid' ) : __( 'Pin to grid' )
				}
				isPressed={ isPinned }
				onClick={ isPinned ? unpinBlock : pinBlock }
			/>
		</BlockControls>
	);
}
