/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { flow, noop, last, every } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { IconButton, withContext } from '@wordpress/components';
import { compose } from '@wordpress/element';
import { cloneBlock, getBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getBlocksByUid, getBlockIndex } from '../../store/selectors';
import { insertBlocks } from '../../store/actions';

export function BlockDuplicateButton( { blockNames, onDuplicate, onClick = noop, isLocked, small = false } ) {
	const canDuplicate = every( blockNames.map( name => {
		const type = getBlockType( name );
		return ! type.useOnce;
	} ) );
	if ( isLocked || ! canDuplicate ) {
		return null;
	}

	const label = __( 'Duplicate' );

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			onClick={ flow( onDuplicate, onClick ) }
			icon="admin-page"
			label={ small ? label : undefined }
		>
			{ ! small && label }
		</IconButton>
	);
}

export default compose(
	connect(
		( state, ownProps ) => ( {
			blocks: getBlocksByUid( state, ownProps.uids ),
			index: getBlockIndex( state, last( ownProps.uids ), ownProps.rootUID ),
		} ),
		{ insertBlocks },
		( { blocks, index }, dispatchProps, { rootUID } ) => ( {
			blockNames: blocks.map( block => block.name ),
			onDuplicate() {
				dispatchProps.insertBlocks(
					blocks.map( block => cloneBlock( block ) ),
					index + 1,
					rootUID
				);
			},
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { templateLock } = settings;

		return {
			isLocked: !! templateLock,
		};
	} ),
)( BlockDuplicateButton );
