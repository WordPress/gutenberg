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

				// Check if sum of all column widths exceeds 100.
				const totalAdjacentWidths = columns.filter( ( column ) => column.attributes.width && column.clientId !== clientId ).reduce( ( total, column ) => total += column.attributes.width, 0 );
				const resetAdjacentColumns = totalAdjacentWidths + width > 100;

				// Create the updated template string. If needed, reset adjacent column widths.
				let columnsTemplate = ``;
				columns.forEach( ( column ) => {
					if ( ( resetAdjacentColumns || ! column.attributes.width ) && column.clientId !== clientId ) {
						columnsTemplate += `1fr `;
						updateBlockAttributes( column.clientId, { width: '' } );
					} else if ( ! column.attributes.width ) {
						columnsTemplate += `1fr `;
					} else {
						columnsTemplate += `${ column.attributes.width }% `;
					}
				} );
				updateBlockAttributes( rootClientId, { columnsTemplate } );
			},
		};
	} )
)( ColumnEdit );
