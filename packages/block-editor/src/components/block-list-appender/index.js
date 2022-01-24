/**
 * External dependencies
 */
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
		const isParentSelected =
			selectedBlockClientId === rootClientId ||
			( ! rootClientId && ! selectedBlockClientId );

		if ( ! isParentSelected ) {
			return null;
		}

		if ( canInsertDefaultBlock ) {
			// Render the default block appender when renderAppender has not been
			// provided and the context supports use of the default appender.
			appender = <DefaultBlockAppender rootClientId={ rootClientId } />;
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
				'block-list-appender wp-block',
				className
			) }
			// The appender exists to let you add the first Paragraph before
			// any is inserted. To that end, this appender should visually be
			// presented as a block. That means theme CSS should style it as if
			// it were an empty paragraph block. That means a `wp-block` class to
			// ensure the width is correct, and a [data-block] attribute to ensure
			// the correct margin is applied, especially for classic themes which
			// have commonly targeted that attribute for margins.
			data-block
		>
			{ appender }
		</TagName>
	);
}

export default withSelect( ( select, { rootClientId } ) => {
	const {
		canInsertBlockType,
		getTemplateLock,
		getSelectedBlockClientId,
	} = select( blockEditorStore );

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		canInsertDefaultBlock: canInsertBlockType(
			getDefaultBlockName(),
			rootClientId
		),
		selectedBlockClientId: getSelectedBlockClientId(),
	};
} )( BlockListAppender );
