/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, BlockControls, BlockVerticalAlignmentToolbar } from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';

function ColumnEdit( {
	attributes,
	updateAlignment,
	hasChildBlocks,
} ) {
	const { verticalAlignment } = attributes;

	const classes = classnames( 'block-core-columns', {
		[ `is-vertically-aligned-${ verticalAlignment }` ]: verticalAlignment,
	} );

	const onChange = ( alignment ) => updateAlignment( alignment );

	return (
		<div className={ classes }>
			<BlockControls>
				<BlockVerticalAlignmentToolbar
					onChange={ onChange }
					value={ verticalAlignment }
				/>
			</BlockControls>
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
		const {
			getBlockRootClientId,
			getBlockOrder,
		} = select( 'core/block-editor' );

		return {
			parentColumnsBlockClientId: getBlockRootClientId( clientId ),
			hasChildBlocks: getBlockOrder( clientId ).length > 0,
		};
	} ),
	withDispatch( ( dispatch, { clientId, parentColumnsBlockClientId } ) => {
		return {
			updateAlignment( alignment ) {
				// Update self...
				dispatch( 'core/editor' ).updateBlockAttributes( clientId, {
					verticalAlignment: alignment,
				} );

				// Reset Parent Columns Block
				dispatch( 'core/editor' ).updateBlockAttributes( parentColumnsBlockClientId, {
					verticalAlignment: null,
				} );
			},
		};
	} )
)( ColumnEdit );
