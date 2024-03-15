/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarGroup, ToolbarButton } from '@wordpress/components';
import { pin as pinIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import { getComputedCSS, getGridLines, getClosestLine } from './utils';

export function GridItemPinToolbarItem( { clientId, layout, onChange } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}

	const isPinned = !! layout?.columnStart && !! layout?.rowStart;

	function unpinBlock() {
		onChange( {
			columnStart: undefined,
			rowStart: undefined,
		} );
	}

	function pinBlock() {
		const gridElement = blockElement.parentElement;
		const columnGap = parseFloat(
			getComputedCSS( gridElement, 'column-gap' )
		);
		const rowGap = parseFloat( getComputedCSS( gridElement, 'row-gap' ) );
		const gridColumnLines = getGridLines(
			getComputedCSS( gridElement, 'grid-template-columns' ),
			columnGap
		);
		const gridRowLines = getGridLines(
			getComputedCSS( gridElement, 'grid-template-rows' ),
			rowGap
		);
		const columnStart =
			getClosestLine( gridColumnLines, blockElement.offsetLeft ) + 1;
		const rowStart =
			getClosestLine( gridRowLines, blockElement.offsetTop ) + 1;
		onChange( {
			columnStart,
			rowStart,
		} );
	}

	return (
		<BlockControls group="parent">
			<ToolbarGroup>
				<ToolbarButton
					icon={ pinIcon }
					label={ __( 'Pin to grid' ) }
					isPressed={ isPinned }
					onClick={ isPinned ? unpinBlock : pinBlock }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
