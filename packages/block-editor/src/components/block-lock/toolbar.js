/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { useReducer, useRef } from '@wordpress/element';
import { lock } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import BlockLockModal from './modal';
import useBlockLock from './use-block-lock';

export default function BlockLockToolbar( { clientId, wrapperRef } ) {
	const { canEdit, canMove, canRemove, canLock } = useBlockLock( clientId );

	const [ isModalOpen, toggleModal ] = useReducer(
		( isActive ) => ! isActive,
		false
	);

	const lockButtonRef = useRef( null );

	if ( ! canLock ) {
		return null;
	}

	if ( canEdit && canMove && canRemove ) {
		return null;
	}

	return (
		<>
			<ToolbarGroup className="block-editor-block-lock-toolbar">
				<ToolbarButton
					icon={ lock }
					label={ __( 'Unlock' ) }
					onClick={ toggleModal }
					ref={ lockButtonRef }
				/>
			</ToolbarGroup>
			{ isModalOpen && (
				<BlockLockModal
					clientId={ clientId }
					onClose={ toggleModal }
					onFocusReturn={ ( defaultFocusReturnElement ) => {
						// Try to focus the element that should have received
						// focus by default.
						if ( defaultFocusReturnElement ) {
							defaultFocusReturnElement.focus();
						}

						// Check if the element that should have received focus is effectively
						// the current active element. This check is useful when the element
						// that should have received focus is not being rendered in the DOM.
						if (
							defaultFocusReturnElement.ownerDocument
								.activeElement !== defaultFocusReturnElement &&
							wrapperRef.current
						) {
							// As a fallback, focus the first focusable button
							// found in the toolbar
							focus.focusable
								.find( wrapperRef.current, {
									sequential: false,
								} )
								.find(
									( element ) =>
										element.tagName === 'BUTTON' &&
										element !== lockButtonRef.current
								)
								?.focus();
						}
					} }
				/>
			) }
		</>
	);
}
