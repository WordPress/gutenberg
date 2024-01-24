/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState, useLayoutEffect } from '@wordpress/element';
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
	const [ addingLink, setAddingLink ] = useState( false );

	const isSelectionCollapsed = isCollapsed( value );

	// There is a situation whereby there is an existing link in the rich text
	// and the user clicks on the leftmost edge of that link and fails to activate
	// the link format, but the click event still fires on the `<a>` element.
	// This causes the `addingLink` state to be set to `true` and the link UI
	// to be rendered in "creating" mode.
	const collapsedSelectionInactiveLink = isSelectionCollapsed && ! isActive;

	useLayoutEffect( () => {
		const editableContentElement = contentRef.current;
		if ( ! editableContentElement ) {
			return;
		}

		function handleClick( event ) {
			if ( event.target.tagName !== 'A' ) {
				return;
			}
			setAddingLink( true );
		}

		editableContentElement.addEventListener( 'click', handleClick );

		return () => {
			editableContentElement.removeEventListener( 'click', handleClick );
			setAddingLink( false );
		};
	}, [ contentRef, isActive ] );

	function addLink() {
		const text = getTextContent( slice( value ) );

		if ( text && isURL( text ) && isValidHref( text ) ) {
			onChange(
				applyFormat( value, {
					type: name,
					attributes: { url: text },
				} )
			);
		} else if ( text && isEmail( text ) ) {
			onChange(
				applyFormat( value, {
					type: name,
					attributes: { url: `mailto:${ text }` },
				} )
			);
		} else {
			setAddingLink( true );
		}
	}

	function stopAddingLink( returnFocus = true ) {
		setAddingLink( false );
		if ( returnFocus ) {
			onFocus();
		}
	}

	function onRemoveFormat() {
		onChange( removeFormat( value, name ) );
		speak( __( 'Link removed.' ), 'assertive' );
	}

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
				title={ isActive ? __( 'Edit Link' ) : title }
				onClick={ addLink }
				isActive={ isActive || addingLink }
				shortcutType="primary"
				shortcutCharacter="k"
				aria-haspopup="true"
				aria-expanded={ addingLink }
				disabled={ collapsedSelectionInactiveLink }
			/>

			{ addingLink && ! collapsedSelectionInactiveLink && (
				<InlineLinkUI
					addingLink={ addingLink }
					stopAddingLink={ stopAddingLink }
					isActive={ isActive }
					activeAttributes={ activeAttributes }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
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
