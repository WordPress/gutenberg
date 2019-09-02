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
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

function ColumnEdit( {
	attributes,
	setAttributes,
	updateAlignment,
	hasChildBlocks,
	parentLock,
} ) {
	const { verticalAlignment, width } = attributes;

	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const hasWidth = Number.isFinite( width );

	return (
		<>
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
						onChange={ ( nextWidth ) => {
							setAttributes( { width: nextWidth } );
						} }
						min={ 0 }
						max={ 100 }
						step={ 0.1 }
						required
						allowReset
						placeholder={
							width === undefined ? __( 'Auto' ) : undefined
						}
					/>
				</PanelBody>
			</InspectorControls>
			<InnerBlocks
				templateLock={ parentLock }
				renderAppender={
					hasChildBlocks
						? undefined
						: () => <InnerBlocks.ButtonBlockAppender />
				}
				__experimentalTagName={ Block.div }
				__experimentalPassedProps={ {
					className: classes,
					style: hasWidth ? { flexBasis: width + '%' } : undefined,
				} }
			/>
		</>
	);
}

export default compose(
	withSelect( ( select, ownProps ) => {
		const { clientId } = ownProps;
		const { getBlockOrder, getBlockRootClientId, getTemplateLock } = select(
			'core/block-editor'
		);

		// Retrieve the parent of the Columns Block.
		const rootParentClientId = getBlockRootClientId(
			getBlockRootClientId( clientId )
		);

		return {
			hasChildBlocks: getBlockOrder( clientId ).length > 0,
			parentLock: getTemplateLock( rootParentClientId ),
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
		};
	} )
)( ColumnEdit );
