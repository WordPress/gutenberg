/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { getPossibleBlockTransformations, switchToBlockType } from '@wordpress/blocks';
import { compose, Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { getBlock } from '../../store/selectors';
import { replaceBlocks } from '../../store/actions';

function BlockTransformations( { blocks, small = false, onTransform, onClick = noop, isLocked, itemsAriaRole } ) {
	const possibleBlockTransformations = getPossibleBlockTransformations( blocks );
	if ( isLocked || ! possibleBlockTransformations.length ) {
		return null;
	}
	return (
		<Fragment>
			<div className="editor-block-settings-menu__separator" />
			<span
				className="editor-block-settings-menu__title"
			>
				{ __( 'Transform into:' ) }
			</span>
			{ possibleBlockTransformations.map( ( { name, title, icon } ) => {
				return (
					<IconButton
						key={ name }
						className="editor-block-settings-menu__control"
						onClick={ ( event ) => {
							onTransform( blocks, name );
							onClick( event );
						} }
						icon={ icon }
						label={ small ? title : undefined }
						role={ itemsAriaRole }
					>
						{ ! small && title }
					</IconButton>
				);
			} ) }
		</Fragment>
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
