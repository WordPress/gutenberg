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
import { getComputedCSS, getGridTracks, getClosestTrack } from './utils';

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
		const gridElement = blockElement.parentElement;
		const columnGap = parseFloat(
			getComputedCSS( gridElement, 'column-gap' )
		);
		const rowGap = parseFloat( getComputedCSS( gridElement, 'row-gap' ) );
		const gridColumnTracks = getGridTracks(
			getComputedCSS( gridElement, 'grid-template-columns' ),
			columnGap
		);
		const gridRowTracks = getGridTracks(
			getComputedCSS( gridElement, 'grid-template-rows' ),
			rowGap
		);
		const columnStart =
			getClosestTrack( gridColumnTracks, blockElement.offsetLeft ) + 1;
		const rowStart =
			getClosestTrack( gridRowTracks, blockElement.offsetTop ) + 1;
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
					label={
						isPinned ? __( 'Pinned to grid' ) : __( 'Pin to grid' )
					}
					isPressed={ isPinned }
					onClick={ isPinned ? unpinBlock : pinBlock }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
