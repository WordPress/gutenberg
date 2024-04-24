/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton } from '@wordpress/components';
import { arrowLeft, arrowUp, arrowDown, arrowRight } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockControls from '../block-controls';

export function GridItemMovers( { layout, parentLayout, onChange } ) {
	const columnStart = layout?.columnStart ?? 1;
	const rowStart = layout?.rowStart ?? 1;
	const columnSpan = layout?.columnSpan ?? 1;
	const rowSpan = layout?.rowSpan ?? 1;
	const columnEnd = columnStart + columnSpan - 1;
	const rowEnd = rowStart + rowSpan - 1;
	const columnCount = parentLayout?.columnCount;
	const rowCount = parentLayout?.rowCount;
	return (
		<BlockControls group="parent">
			<ToolbarButton
				icon={ arrowUp }
				label={ __( 'Move block up' ) }
				isDisabled={ rowStart <= 1 }
				onClick={ () =>
					onChange( {
						rowStart: rowStart - 1,
					} )
				}
			/>
			<ToolbarButton
				icon={ arrowDown }
				label={ __( 'Move block down' ) }
				isDisabled={ rowCount && rowEnd >= rowCount }
				onClick={ () =>
					onChange( {
						rowStart: rowStart + 1,
					} )
				}
			/>
			<ToolbarButton
				icon={ arrowLeft }
				label={ __( 'Move block left' ) }
				isDisabled={ columnStart <= 1 }
				onClick={ () =>
					onChange( {
						columnStart: columnStart - 1,
					} )
				}
			/>
			<ToolbarButton
				icon={ arrowRight }
				label={ __( 'Move block right' ) }
				isDisabled={ columnCount && columnEnd >= columnCount }
				onClick={ () =>
					onChange( {
						columnStart: columnStart + 1,
					} )
				}
			/>
		</BlockControls>
	);
}
