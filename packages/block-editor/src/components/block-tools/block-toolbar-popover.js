/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockToolbar from '../block-toolbar';
import BlockPopover from '../block-popover';
import useBlockToolbarPopoverProps from './use-block-toolbar-popover-props';
import useSelectedBlockToolProps from './use-selected-block-tool-props';

export default function BlockToolbarPopover( {
	clientId,
	isTyping,
	__unstableContentRef,
} ) {
	const { capturingClientId, isInsertionPointVisible, lastClientId } =
		useSelectedBlockToolProps( clientId );

	const popoverProps = useBlockToolbarPopoverProps( {
		contentElement: __unstableContentRef?.current,
		clientId,
	} );

	const hasStoppedTyping = useRef( false );

	useEffect( () => {
		if ( hasStoppedTyping.current ) {
			return;
		}

		if ( ! hasStoppedTyping.current && ! isTyping ) {
			hasStoppedTyping.current = true;
		}
	}, [ isTyping ] );

	if ( ! isTyping || hasStoppedTyping.current ) {
		console.log( 'will mount' );
	}

	// ff the clientID changes, unmount the popover
	// useEffect( () => {
	// 	hasStoppedTyping.current = false;
	// }, [ clientId ] );

	return (
		( ! isTyping || hasStoppedTyping.current ) && (
			<BlockPopover
				clientId={ capturingClientId || clientId }
				bottomClientId={ lastClientId }
				className={ classnames(
					'block-editor-block-list__block-popover',
					{
						'is-insertion-point-visible': isInsertionPointVisible,
						'is-hidden': isTyping, // Leave the toolbar in the DOM so it can be focused at the same roving tabindex it was previously at
					}
				) }
				resize={ false }
				{ ...popoverProps }
			>
				<BlockToolbar isTyping={ isTyping } variant="highContrast" />
			</BlockPopover>
		)
	);
}
