/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';
import { useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopover from '../block-popover';
import { getComputedCSS } from './utils';

export function GridItemResizer( { clientId, onChange } ) {
	const resizableRef = useRef();
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}
	return (
		<BlockPopover
			clientId={ clientId }
			__unstableCoverTarget
			__unstablePopoverSlot="block-toolbar"
		>
			<ResizableBox
				ref={ resizableRef }
				defaultSize={ {
					width: '100%',
					height: '100%',
				} }
				enable={ {
					bottom: true,
					bottomLeft: false,
					bottomRight: false,
					left: true,
					right: true,
					top: true,
					topLeft: false,
					topRight: false,
				} }
				onResizeStop={ ( event, direction, element ) => {
					const boxWidth = element.offsetWidth;
					const boxHeight = element.offsetHeight;
					const { columnGap, rowGap, itemWidth, itemHeight } =
						getGridDimensions( blockElement.parentElement );
					const columnSpan = Math.round(
						( columnGap + boxWidth ) / ( columnGap + itemWidth )
					);
					const rowSpan = Math.round(
						( rowGap + boxHeight ) / ( rowGap + itemHeight )
					);
					const newBoxWidth =
						columnSpan * itemWidth + ( columnSpan - 1 ) * columnGap;
					const newBoxHeight =
						rowSpan * itemHeight + ( rowSpan - 1 ) * rowGap;
					onChange( {
						columnSpan,
						rowSpan,
					} );
					resizableRef.current.updateSize( {
						width: newBoxWidth,
						height: newBoxHeight,
					} );
				} }
			>
				<div
					style={ {
						width: '100%',
						height: '100%',
						border: '1px solid blue',
					} }
				/>
			</ResizableBox>
		</BlockPopover>
	);
}

function getGridDimensions( element ) {
	const width = element.clientWidth;
	const height = element.clientHeight;
	const paddingX =
		parseFloat( getComputedCSS( element, 'padding-left' ) ) +
		parseFloat( getComputedCSS( element, 'padding-right' ) );
	const paddingY =
		parseFloat( getComputedCSS( element, 'padding-top' ) ) +
		parseFloat( getComputedCSS( element, 'padding-bottom' ) );
	const gridTemplateColumns = getComputedCSS(
		element,
		'grid-template-columns'
	);
	const gridTemplateRows = getComputedCSS( element, 'grid-template-rows' );
	const numColumns = gridTemplateColumns.split( ' ' ).length;
	const numRows = gridTemplateRows.split( ' ' ).length;
	const columnGap = parseFloat( getComputedCSS( element, 'column-gap' ) );
	const rowGap = parseFloat( getComputedCSS( element, 'row-gap' ) );
	const totalColumnGap = columnGap * ( numColumns - 1 );
	const totalRowGap = rowGap * ( numRows - 1 );
	const itemWidth = ( width - paddingX - totalColumnGap ) / numColumns;
	const itemHeight = ( height - paddingY - totalRowGap ) / numRows;
	return {
		columnGap,
		rowGap,
		itemWidth,
		itemHeight,
	};
}
