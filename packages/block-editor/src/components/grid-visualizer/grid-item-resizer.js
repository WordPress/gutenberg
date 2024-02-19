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
			className="block-editor-grid-item-resizer"
			clientId={ clientId }
			__unstableCoverTarget
			__unstablePopoverSlot="block-toolbar"
			shift={ false }
		>
			<ResizableBox
				ref={ resizableRef }
				className="block-editor-grid-item-resizer__box"
				defaultSize={ {
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
					const columnSpan = Math.max( columnEnd - columnStart, 1 );
					const rowSpan = Math.max( rowEnd - rowStart, 1 );
					const width =
						gridColumnLines[ columnStart + columnSpan ] -
						gridColumnLines[ columnStart ] -
						columnGap;
					const height =
						gridRowLines[ rowStart + rowSpan ] -
						gridRowLines[ rowStart ] -
						rowGap;
					onChange( { columnSpan, rowSpan } );
					resizableRef.current.updateSize( { width, height } );
				} }
			/>
		</BlockPopover>
	);
}

/**
 * @param {string} template
 * @param {number} gap
 */
function getGridLines( template, gap ) {
	const lines = [ 0 ];
	for ( const size of template.split( ' ' ) ) {
		const line = parseFloat( size );
		lines.push( lines[ lines.length - 1 ] + line + gap );
	}
	return lines;
}

/**
 * @param {number[]} lines
 * @param {number}   position
 */
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
