/**
 * External dependencies
 */
import { last } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { getDefaultBlockName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import DefaultBlockAppender from '../default-block-appender';
import ButtonBlockAppender from '../button-block-appender';

function BlockListAppender( {
	blockClientIds,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
	renderAppender: CustomAppender,
} ) {
	if ( isLocked || CustomAppender === false ) {
		return null;
	}

	let appender;
	if ( CustomAppender ) {
		// Prefer custom render prop if provided.
		appender = <CustomAppender />;
	} else if ( canInsertDefaultBlock ) {
		// Render the default block appender when renderAppender has not been
		// provided and the context supports use of the default appender.
		appender = (
			<DefaultBlockAppender
				rootClientId={ rootClientId }
				lastBlockClientId={ last( blockClientIds ) }
			/>
		);
	} else {
		// Fallback in the case no renderAppender has been provided and the
		// default block can't be inserted.
		appender = (
			<ButtonBlockAppender
				rootClientId={ rootClientId }
				className="block-list-appender__toggle"
			/>
		);
	}

	return (
		<div tabIndex={ -1 } className="block-list-appender">
			{ appender }
		</div>
	);
}

export default withSelect( ( select, { rootClientId } ) => {
	const {
		getBlockOrder,
		canInsertBlockType,
		getTemplateLock,
	} = select( 'core/block-editor' );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType( getDefaultBlockName(), rootClientId ),
	};
} )( BlockListAppender );
