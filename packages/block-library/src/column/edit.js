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
	updateAlignment,
	updateWidth,
	hasChildBlocks,
} ) {
	const { verticalAlignment, width } = attributes;

	const classes = classnames( 'block-core-columns', {
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
				<PanelBody title={ __( 'Column Settings' ) }>
					<RangeControl
						label={ __( 'Width' ) }
						value={ width }
						onChange={ updateWidth }
						min={ 0 }
						max={ 100 }
						required
					/>
				</PanelBody>
			</InspectorControls>
			<InnerBlocks
				templateLock={ false }
				renderAppender={ (
					hasChildBlocks ?
						undefined :
						() => <InnerBlocks.ButtonBlockAppender />
				) }
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
				const { updateBlockAttributes } = dispatch( 'core/block-editor' );
				const { getBlockRootClientId } = registry.select( 'core/block-editor' );

				// Update own alignment.
				setAttributes( { verticalAlignment } );

				// Reset Parent Columns Block
				const rootClientId = getBlockRootClientId( clientId );
				updateBlockAttributes( rootClientId, { verticalAlignment: null } );
			},
			updateWidth( width ) {
				const { clientId, attributes, setAttributes } = ownProps;
				const { updateBlockAttributes } = dispatch( 'core/block-editor' );
				const {
					getBlockRootClientId,
					getBlockOrder,
					getBlockAttributes,
				} = registry.select( 'core/block-editor' );

				// Update own width.
				setAttributes( { width } );

				// Constrain or expand siblings to account for gain or loss of
				// total columns area.
				const rootClientId = getBlockRootClientId( clientId );
				const columnClientIds = getBlockOrder( rootClientId );
				const { width: previousWidth = 100 / columnClientIds.length } = attributes;
				const index = columnClientIds.indexOf( clientId );
				const isLastColumn = index === columnClientIds.length - 1;
				const increment = isLastColumn ? -1 : 1;
				const endIndex = isLastColumn ? 0 : columnClientIds.length - 1;
				const adjustment = ( previousWidth - width ) / Math.abs( index - endIndex );

				for ( let i = index + increment; i - increment !== endIndex; i += increment ) {
					const columnClientId = columnClientIds[ i ];
					const { width: columnWidth = 100 / columnClientIds.length } = getBlockAttributes( columnClientId );
					updateBlockAttributes( columnClientId, {
						width: columnWidth + adjustment,
					} );
				}
			},
		};
	} )
)( ColumnEdit );
