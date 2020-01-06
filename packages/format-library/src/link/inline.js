/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState, useMemo, useEffect } from '@wordpress/element';
import {
	ToggleControl,
	withSpokenMessages,
} from '@wordpress/components';
import { LEFT, RIGHT, UP, DOWN, BACKSPACE, ENTER } from '@wordpress/keycodes';
import { prependHTTP } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text';
import { URLPopover } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

const stopKeyPropagation = ( event ) => event.stopPropagation();

const URLPopoverAtLink = ( { isActive, addingLink, value, ...props } ) => {
	const anchorRef = useMemo( () => {
		const selection = window.getSelection();

		if ( ! selection.rangeCount ) {
			return;
		}

		const range = selection.getRangeAt( 0 );

		if ( addingLink ) {
			return range;
		}

		let element = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = element.nextElementSibling || element;

		while ( element.nodeType !== window.Node.ELEMENT_NODE ) {
			element = element.parentNode;
		}

		return element.closest( 'a' );
	}, [ isActive, addingLink, value.start, value.end ] );

	if ( ! anchorRef ) {
		return null;
	}

	return <URLPopover anchorRef={ anchorRef } { ...props } />;
};

function InlineLinkUI( {
	isActive,
	activeAttributes,
	addingLink,
	value,
	onChange,
	stopAddingLink,
	speak,
} ) {
	const [ opensInNewWindow, setOpensInNewWindow ] = useState( false );
	const [ inputValue, setInputValue ] = useState( '' );
	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const autocompleteRef = useRef();

	const { url, target } = activeAttributes;
	const isShowingInput = addingLink || isEditingLink;

	useEffect( () => {
		if ( ! isShowingInput ) {
			setInputValue( url );
			setOpensInNewWindow( target === '_blank' );
		}
	} );

	function onKeyDown( event ) {
		if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
			// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
			event.stopPropagation();
		}
	}

	function setLinkTarget( nextOpensInNewWindow ) {
		setOpensInNewWindow( nextOpensInNewWindow );

		// Apply now if URL is not being edited.
		if ( ! isShowingInput ) {
			const selectedText = getTextContent( slice( value ) );

			onChange( applyFormat( value, createLinkFormat( {
				url,
				opensInNewWindow: nextOpensInNewWindow,
				text: selectedText,
			} ) ) );
		}
	}

	function editLink( event ) {
		setIsEditingLink( true );
		event.preventDefault();
	}

	function submitLink( event ) {
		const nextURL = prependHTTP( inputValue );
		const selectedText = getTextContent( slice( value ) );
		const format = createLinkFormat( {
			url: nextURL,
			opensInNewWindow,
			text: selectedText,
		} );

		event.preventDefault();

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat( create( { text: nextURL } ), format, 0, nextURL.length );
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		resetState();

		if ( ! isValidHref( nextURL ) ) {
			speak( __( 'Warning: the link has been inserted but may have errors. Please test it.' ), 'assertive' );
		} else if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	function onFocusOutside() {
		// The autocomplete suggestions list renders in a separate popover (in a portal),
		// so onFocusOutside fails to detect that a click on a suggestion occurred in the
		// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
		// return to avoid the popover being closed.
		const autocompleteElement = autocompleteRef.current;
		if ( autocompleteElement && autocompleteElement.contains( document.activeElement ) ) {
			return;
		}

		resetState();
	}

	function resetState() {
		stopAddingLink();
		setIsEditingLink( false );
	}

	return (
		<URLPopoverAtLink
			value={ value }
			isActive={ isActive }
			addingLink={ addingLink }
			onFocusOutside={ onFocusOutside }
			onClose={ resetState }
			focusOnMount={ isShowingInput ? 'firstElement' : false }
			renderSettings={ () => (
				<ToggleControl
					label={ __( 'Open in New Tab' ) }
					checked={ opensInNewWindow }
					onChange={ setLinkTarget }
				/>
			) }
		>
			{ isShowingInput ? (
				<URLPopover.LinkEditor
					className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
					value={ inputValue }
					onChangeInputValue={ setInputValue }
					onKeyDown={ onKeyDown }
					onKeyPress={ stopKeyPropagation }
					onSubmit={ submitLink }
					autocompleteRef={ autocompleteRef }
				/>
			) : (
				<URLPopover.LinkViewer
					className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
					onKeyPress={ stopKeyPropagation }
					url={ url }
					onEditLinkClick={ editLink }
					linkClassName={ isValidHref( prependHTTP( url ) ) ? undefined : 'has-invalid-link' }
				/>
			) }
		</URLPopoverAtLink>
	);
}

export default withSpokenMessages( InlineLinkUI );
