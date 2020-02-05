/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	InnerBlocks,
	BlockControls,
	BlockVerticalAlignmentToolbar,
	InspectorControls,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

function ColumnEdit( {
	attributes,
	className,
	updateAlignment,
	updateWidth,
	hasChildBlocks,
} ) {
	const { verticalAlignment, width } = attributes;

	const classes = classnames( className, 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	return (
		<div className={ classes }>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ updateAlignment }
					value={ verticalAlignment }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ __( 'Column settings' ) }>
					<RangeControl
						label={ __( 'Percentage width' ) }
						value={ width || '' }
						initialPosition={ 0 }
						onChange={ updateWidth }
						min={ 0 }
						max={ 100 }
						required
						allowReset
					/>
				</PanelBody>
			</InspectorControls>
			<InnerBlocks
				templateLock={ false }
				renderAppender={
					hasChildBlocks
						? undefined
						: () => <InnerBlocks.ButtonBlockAppender />
				}
			/>
		</div>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { clientId } = ownProps;
		const { getBlockOrder } = select( 'core/block-editor' );

		return {
			hasChildBlocks: getBlockOrder( clientId ).length > 0,
		};
	} ),
	withDispatch( ( dispatch, ownProps, registry ) => {
		return {
			updateAlignment( verticalAlignment ) {
				const { clientId, setAttributes } = ownProps;
				const { updateBlockAttributes } = dispatch(
					'core/block-editor'
				);
				const { getBlockRootClientId } = registry.select(
					'core/block-editor'
				);

				// Update own alignment.
				setAttributes( { verticalAlignment } );

				// Reset Parent Columns Block
				const rootClientId = getBlockRootClientId( clientId );
				updateBlockAttributes( rootClientId, {
					verticalAlignment: null,
				} );
			},
			updateWidth( width ) {
				const { clientId } = ownProps;
				const { updateBlockAttributes } = dispatch(
					'core/block-editor'
				);
				const { getBlockRootClientId, getBlocks } = registry.select(
					'core/block-editor'
				);

				// Update column width.
				updateBlockAttributes( clientId, { width } );

				const rootClientId = getBlockRootClientId( clientId );
				const columns = getBlocks( rootClientId );
				// Get all explicit, positive, column widths.
				const columnWidths = columns.map( ( columnWidth ) => {
					if ( ! columnWidth || columnWidth < 0 ) {
						return null;
					}
					return columnWidth;
				} );
				// Check if sum of all column widths exceeds 100. (We are using 'fr' units but treating them as percentages.)
				const resetAdjacentColumns = columnWidths.reduce( ( total, columnWidth ) => total + columnWidth ) > 100;

				// If total widths exceed 100, reset adjacent column widths.
				columns.forEach( ( column ) => {
					if ( ( resetAdjacentColumns || ! column.attributes.width ) && column.clientId !== clientId ) {
						updateBlockAttributes( column.clientId, { width: '' } );
					}
				} );
			},
		};
	} )
)( ColumnEdit );
