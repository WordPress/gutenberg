/**
 * External dependencies
 */
import { last } from 'lodash';
import classnames from 'classnames';

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
import { store as blockEditorStore } from '../../store';

function BlockListAppender( {
	blockClientIds,
	rootClientId,
	canInsertDefaultBlock,
	isLocked,
	renderAppender: CustomAppender,
	className,
	selectedBlockClientId,
	tagName: TagName = 'div',
} ) {
	if ( isLocked || CustomAppender === false ) {
		return null;
	}

	let appender;
	if ( CustomAppender ) {
		// Prefer custom render prop if provided.
		appender = <CustomAppender />;
	} else {
		const isDocumentAppender = ! rootClientId;
		const isParentSelected = selectedBlockClientId === rootClientId;
		const isAnotherDefaultAppenderAlreadyDisplayed =
			selectedBlockClientId &&
			! blockClientIds.includes( selectedBlockClientId );

		if (
			! isDocumentAppender &&
			! isParentSelected &&
			( ! selectedBlockClientId ||
				isAnotherDefaultAppenderAlreadyDisplayed )
		) {
			return null;
		}

		if ( canInsertDefaultBlock ) {
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
	}

	return (
		<TagName
			// A `tabIndex` is used on the wrapping `div` element in order to
			// force a focus event to occur when an appender `button` element
			// is clicked. In some browsers (Firefox, Safari), button clicks do
			// not emit a focus event, which could cause this event to propagate
			// unexpectedly. The `tabIndex` ensures that the interaction is
			// captured as a focus, without also adding an extra tab stop.
			//
			// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#Clicking_and_focus
			tabIndex={ -1 }
			className={ classnames(
				'block-list-appender',
				'wp-block',
				className
			) }
		>
			{ appender }
		</TagName>
	);
}

export default withSelect( ( select, { rootClientId } ) => {
	const {
		getBlockOrder,
		canInsertBlockType,
		getTemplateLock,
		getSelectedBlockClientId,
	} = select( blockEditorStore );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		),
		selectedBlockClientId: getSelectedBlockClientId(),
	};
} )( BlockListAppender );
