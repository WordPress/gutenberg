/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { getPossibleBlockTransformations, switchToBlockType } from '@wordpress/blocks';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlock } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function BlockTransformations( { blocks, small = false, onTransform, onClick = noop, isLocked } ) {
	const possibleBlockTransformations = getPossibleBlockTransformations( blocks );
	if ( isLocked || ! possibleBlockTransformations.length ) {
		return null;
	}
	return (
		<div className="editor-block-settings-menu__section">
			{ possibleBlockTransformations.map( ( { name, title, icon } ) => {
			/* translators: label indicating the transformation of a block into another block */
				const shownText = sprintf( __( 'Turn into %s' ), title );
				return (
					<IconButton
						key={ name }
						className="editor-block-settings-menu__control"
						onClick={ ( event ) => {
							onTransform( blocks, name );
							onClick( event );
						} }
						icon={ icon }
						label={ small ? shownText : undefined }
					>
						{ ! small && shownText }
					</IconButton>
				);
			} ) }
		</div>
	);
}
export default compose(
	connect(
		( state, ownProps ) => {
			return {
				blocks: ownProps.uids.map( ( uid ) => getBlock( state, uid ) ),
			};
		},
		( dispatch, ownProps ) => ( {
			onTransform( blocks, name ) {
				dispatch( replaceBlocks(
					ownProps.uids,
					switchToBlockType( blocks, name )
				) );
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockTransformations );
