/**
 * Internal dependencies
 */
import { __unstableUseBlockElement as useBlockElement } from '../block-list/use-block-props/use-block-refs';
import BlockPopover from '../block-popover';
import { getComputedCSS } from './utils';

export function GridVisualizer( { clientId } ) {
	const blockElement = useBlockElement( clientId );
	if ( ! blockElement ) {
		return null;
	}
	const gridTemplateColumns = getComputedCSS(
		blockElement,
		'grid-template-columns'
	);
	const gridTemplateRows = getComputedCSS(
		blockElement,
		'grid-template-rows'
	);
	const numColumns = gridTemplateColumns.split( ' ' ).length;
	const numRows = gridTemplateRows.split( ' ' ).length;
	const numItems = numColumns * numRows;
	return (
		<BlockPopover
			className="block-editor-grid-visualizer"
			clientId={ clientId }
			__unstableCoverTarget
			__unstablePopoverSlot="block-toolbar"
		>
			<div
				className="block-editor-grid-visualizer__grid"
				style={ {
					gridTemplateColumns,
					gridTemplateRows,
					gap: getComputedCSS( blockElement, 'gap' ),
					padding: getComputedCSS( blockElement, 'padding' ),
				} }
			>
				{ Array.from( { length: numItems }, ( _, i ) => (
					<div
						key={ i }
						className="block-editor-grid-visualizer__item"
					/>
				) ) }
			</div>
		</BlockPopover>
	);
}
