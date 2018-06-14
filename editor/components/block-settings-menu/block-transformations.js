/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton } from '@wordpress/components';
import { getPossibleBlockTransformations, switchToBlockType } from '@wordpress/blocks';
import { compose, Fragment } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import './style.scss';

function BlockTransformations( { blocks, small = false, onTransform, onClick = noop, isLocked, itemsRole } ) {
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
						icon={ icon.src }
						label={ small ? title : undefined }
						role={ itemsRole }
					>
						{ ! small && title }
					</IconButton>
				);
			} ) }
		</Fragment>
	);
}
export default compose( [
	withSelect( ( select, { uids } ) => {
		const { getEditorSettings, getBlocksByUID } = select( 'core/editor' );
		const { templateLock } = getEditorSettings();
		return {
			isLocked: !! templateLock,
			blocks: getBlocksByUID( uids ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => ( {
		onTransform( blocks, name ) {
			dispatch( 'core/editor' ).replaceBlocks(
				ownProps.uids,
				switchToBlockType( blocks, name )
			);
		},
	} ) ),
] )( BlockTransformations );
