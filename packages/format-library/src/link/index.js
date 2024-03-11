/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useLayoutEffect, useEffect } from '@wordpress/element';
import {
	getTextContent,
	applyFormat,
	removeFormat,
	slice,
	isCollapsed,
	insert,
	create,
} from '@wordpress/rich-text';
import { isURL, isEmail } from '@wordpress/url';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { link as linkIcon } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import InlineLinkUI from './inline';
import { isValidHref } from './utils';

const name = 'core/link';
const title = __( 'Link' );

function Edit( {
	isActive,
	activeAttributes,
	value,
	onChange,
	onFocus,
	contentRef,
} ) {
	const [ editingLink, setEditingLink ] = useState( false );
	const [ creatingLink, setCreatingLink ] = useState( false );

	// We only need to store the button element that opened the popover. We can ignore the other states, as they will be handled by the onFocus prop to return to the rich text field.
	const [ openedBy, setOpenedBy ] = useState( null );

	// Manages whether the Link UI popover should autofocus when shown.
	const [ shouldAutoFocus, setShouldAutoFocus ] = useState( true );

	function setIsEditingLink( isEditing, { autoFocus = true } = {} ) {
		setEditingLink( isEditing );
		setShouldAutoFocus( autoFocus );
	}

	function setIsCreatingLink( isCreating ) {
		// Don't add a new link if there is already an active link.
		// The two states are mutually exclusive.
		if ( isCreating === true && isActive ) {
			return;
		}
		setCreatingLink( isCreating );
	}

	useEffect( () => {
		// When the link becomes inactive (i.e. isActive is false), reset the editingLink state
		// and the creatingLink state. This means that if the Link UI is displayed and the link
		// becomes inactive (e.g. used arrow keys to move cursor outside of link bounds), the UI will close.
		if ( ! isActive ) {
			setEditingLink( false );
			setCreatingLink( false );
		}
	}, [ isActive ] );

	useLayoutEffect( () => {
		const editableContentElement = contentRef.current;
		if ( ! editableContentElement ) {
			return;
		}

		function handleClick( event ) {
			// There is a situation whereby there is an existing link in the rich text
			// and the user clicks on the leftmost edge of that link and fails to activate
			// the link format, but the click event still fires on the `<a>` element.
			// This causes the `editingLink` state to be set to `true` and the link UI
			// to be rendered in "creating" mode. We need to check isActive to see if
			// we have an active link format.
			if (
				! event.target.closest( '[contenteditable] a' ) || // other formats (e.g. bold) may be nested within the link.
				! isActive
			) {
				setIsEditingLink( false );
				return;
			}

			setIsEditingLink( true, { autoFocus: false } );
		}

		editableContentElement.addEventListener( 'click', handleClick );

		return () => {
			editableContentElement.removeEventListener( 'click', handleClick );
		};
	}, [ contentRef, isActive ] );

	function addLink( target ) {
		setShouldAutoFocus( true );
		const text = getTextContent( slice( value ) );

		if ( ! isActive && text && isURL( text ) && isValidHref( text ) ) {
			onChange(
				applyFormat( value, {
					type: name,
					attributes: { url: text },
				} )
			);
		} else if ( ! isActive && text && isEmail( text ) ) {
			onChange(
				applyFormat( value, {
					type: name,
					attributes: { url: `mailto:${ text }` },
				} )
			);
		} else {
			if ( target ) {
				setOpenedBy( target );
			}
			if ( ! isActive ) {
				setIsCreatingLink( true );
			} else {
				setIsEditingLink( true );
			}
		}
	}

	/**
	 * Runs when the popover is closed via escape keypress, unlinking the selected text,
	 * but _not_ on a click outside the popover. onFocusOutside handles that.
	 */
	function stopAddingLink() {
		// Don't let the click handler on the toolbar button trigger again.

		// There are two places for us to return focus to on Escape keypress:
		// 1. The rich text field.
		// 2. The toolbar button.

		// The toolbar button is the only one we need to handle returning focus to.
		// Otherwise, we rely on the passed in onFocus to return focus to the rich text field.

		// Close the popover
		setIsEditingLink( false );
		setIsCreatingLink( false );

		// Return focus to the toolbar button or the rich text field
		if ( openedBy?.tagName === 'BUTTON' ) {
			openedBy.focus();
		} else {
			onFocus();
		}
		// Remove the openedBy state
		setOpenedBy( null );
	}

	// Test for this:
	// 1. Click on the link button
	// 2. Click the Options button in the top right of header
	// 3. Focus should be in the dropdown of the Options button
	// 4. Press Escape
	// 5. Focus should be on the Options button
	function onFocusOutside() {
		setIsEditingLink( false );
		setIsCreatingLink( false );
		setOpenedBy( null );
	}

	function onRemoveFormat() {
		onChange( removeFormat( value, name ) );
		speak( __( 'Link removed.' ), 'assertive' );
	}

	const isEditingActiveLink = editingLink && isActive;

	return (
		<>
			<RichTextShortcut type="primary" character="k" onUse={ addLink } />
			<RichTextShortcut
				type="primaryShift"
				character="k"
				onUse={ onRemoveFormat }
			/>
			<RichTextToolbarButton
				name="link"
				icon={ linkIcon }
				title={ isActive ? __( 'Link' ) : title }
				onClick={ ( event ) => {
					addLink( event.currentTarget );
				} }
				isActive={ isActive || editingLink }
				shortcutType="primary"
				shortcutCharacter="k"
				aria-haspopup="true"
				aria-expanded={ editingLink }
			/>
			{ ( isEditingActiveLink || creatingLink ) && (
				<InlineLinkUI
					stopAddingLink={ stopAddingLink }
					onFocusOutside={ onFocusOutside }
					isActive={ isActive }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
					focusOnMount={ shouldAutoFocus ? 'firstElement' : false }
				/>
			) }
		</>
	);
}

export const link = {
	name,
	title,
	tagName: 'a',
	className: null,
	attributes: {
		url: 'href',
		type: 'data-type',
		id: 'data-id',
		_id: 'id',
		target: 'target',
		rel: 'rel',
	},
	__unstablePasteRule( value, { html, plainText } ) {
		const pastedText = ( html || plainText )
			.replace( /<[^>]+>/g, '' )
			.trim();

		// A URL was pasted, turn the selection into a link.
		// For the link pasting feature, allow only http(s) protocols.
		if ( ! isURL( pastedText ) || ! /^https?:/.test( pastedText ) ) {
			return value;
		}

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Created link:\n\n', pastedText );

		const format = {
			type: name,
			attributes: {
				url: decodeEntities( pastedText ),
			},
		};

		if ( isCollapsed( value ) ) {
			return insert(
				value,
				applyFormat(
					create( { text: plainText } ),
					format,
					0,
					plainText.length
				)
			);
		}

		return applyFormat( value, format );
	},
	edit: Edit,
};
