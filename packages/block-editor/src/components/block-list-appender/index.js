/**
 * External dependencies
 */
import { last } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ButtonBlockAppender from '../button-block-appender';
import DefaultInnerBlockAppender from '../default-inner-block-appender';
import DefaultBlockAppender from '../default-block-appender';

// A Context to store the map of the appender map.
export const AppenderNodesContext = createContext();

function stopPropagation( event ) {
	event.stopPropagation();
}

function BlockListAppender( {
	blockClientIds,
	rootClientId,
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
		const isSiblingSelected =
			selectedBlockClientId &&
			blockClientIds.includes( selectedBlockClientId );

		if ( isDocumentAppender ) {
			appender = (
				<DefaultBlockAppender
					rootClientId={ rootClientId }
					lastBlockClientId={ last( blockClientIds ) }
				/>
			);
		} else if (
			( isParentSelected || isSiblingSelected ) &&
			blockClientIds.length
		) {
			// Render the default block list appender when there's at least one block.
			appender = (
				<DefaultInnerBlockAppender
					rootClientId={ rootClientId }
					lastBlockClientId={ last( blockClientIds ) }
				/>
			);
		} else if ( isParentSelected || isSiblingSelected ) {
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
			// Prevent the block from being selected when the appender is
			// clicked.
			onFocus={ stopPropagation }
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
	const { getBlockOrder, getTemplateLock, getSelectedBlockClientId } = select(
		'core/block-editor'
	);

	return {
		isLocked: !! getTemplateLock( rootClientId ),
		blockClientIds: getBlockOrder( rootClientId ),
		selectedBlockClientId: getSelectedBlockClientId(),
	};
} )( BlockListAppender );
