/**
 * WordPress dependencies
 */
import { ResizableBox } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopoverCover from '../block-popover/cover';
import { getComputedCSS } from './utils';

export function GridItemResizer( { clientId, onChange } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}
	return (
		<BlockPopoverCover
			className="block-editor-grid-item-resizer"
			clientId={ clientId }
			__unstablePopoverSlot="block-toolbar"
		>
			<ResizableBox
				className="block-editor-grid-item-resizer__box"
				size={ {
					width: '100%',
					height: '100%',
				} }
				enable={ {
					bottom: true,
					bottomLeft: false,
					bottomRight: false,
					left: false,
					right: true,
					top: false,
					topLeft: false,
					topRight: false,
				} }
				onResizeStop={ ( event, direction, boxElement ) => {
					const gridElement = blockElement.parentElement;
					const columnGap = parseFloat(
						getComputedCSS( gridElement, 'column-gap' )
					);
					const rowGap = parseFloat(
						getComputedCSS( gridElement, 'row-gap' )
					);
					const gridColumnLines = getGridLines(
						getComputedCSS( gridElement, 'grid-template-columns' ),
						columnGap
					);
					const gridRowLines = getGridLines(
						getComputedCSS( gridElement, 'grid-template-rows' ),
						rowGap
					);
					const columnStart = getClosestLine(
						gridColumnLines,
						blockElement.offsetLeft
					);
					const rowStart = getClosestLine(
						gridRowLines,
						blockElement.offsetTop
					);
					const columnEnd = getClosestLine(
						gridColumnLines,
						blockElement.offsetLeft + boxElement.offsetWidth
					);
					const rowEnd = getClosestLine(
						gridRowLines,
						blockElement.offsetTop + boxElement.offsetHeight
					);
					onChange( {
						columnSpan: Math.max( columnEnd - columnStart, 1 ),
						rowSpan: Math.max( rowEnd - rowStart, 1 ),
					} );
				} }
			/>
		</BlockPopoverCover>
	);
}

function getGridLines( template, gap ) {
	const lines = [ 0 ];
	for ( const size of template.split( ' ' ) ) {
		const line = parseFloat( size );
		lines.push( lines[ lines.length - 1 ] + line + gap );
	}
	return lines;
}

function getClosestLine( lines, position ) {
	return lines.reduce(
		( closest, line, index ) =>
			Math.abs( line - position ) <
			Math.abs( lines[ closest ] - position )
				? index
				: closest,
		0
	);
}
