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

const ColumnEdit = ( { attributes, updateAlignment } ) => {
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
			<InnerBlocks templateLock={ false } />
		</div>
	);
};

export default compose(
	withSelect( ( select, { clientId } ) => {
		const { getBlockRootClientId } = select( 'core/editor' );

		return {
			parentColumnsBlockClientId: getBlockRootClientId( clientId ),
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
