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
import { isURL, isEmail, isPhoneNumber } from '@wordpress/url';
import {
	RichTextToolbarButton,
	RichTextShortcut,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { link as linkIcon } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import InlineLinkUI from './inline';
import { isValidHref } from './utils';
import { unlock } from '../lock-unlock';

const { essentialFormatKey } = unlock( blockEditorPrivateApis );

const name = 'core/link';
const title = __( 'Link' );

function Edit( {
	isActive,
	activeAttributes,
	value,
	onChange,
	onFocus,
	contentRef,
	isVisible = true,
} ) {
	const [ addingLink, setAddingLink ] = useState( false );
	const [ openedBy, setOpenedBy ] = useState( null );

	useEffect( () => {
		if ( ! isActive ) {
			setAddingLink( false );
		}
	}, [ isActive ] );

	/**
	 * 🔒 CORE FIX
	 * Remove href="#" from editor DOM anchors so browser never scrolls
	 * (model still keeps correct href → saved output is untouched)
	 */
	function neutralizeEditorAnchors() {
		const editable = contentRef?.current;
		if ( ! editable ) {
			return;
		}

		const anchors = editable.querySelectorAll( 'a[href^="#"]' );
		anchors.forEach( ( a ) => {
			a.setAttribute(
				'data-editor-href',
				a.getAttribute( 'href' ) || ''
			);
			a.removeAttribute( 'href' );
			a.setAttribute( 'role', 'link' );
			a.setAttribute( 'tabindex', '-1' );
		} );
	}

	useLayoutEffect( () => {
		const editable = contentRef.current;
		if ( ! editable ) {
			return;
		}

		// 🔑 Neutralize immediately on mount
		neutralizeEditorAnchors();

		function handleClick( event ) {
			const link = event.target.closest( '[contenteditable] a' );
			if ( ! link ) {
				return;
			}

			// extra safety — browser sees no href anyway
			event.preventDefault();
			event.stopPropagation();

			if ( ! isActive ) {
				return;
			}

			setAddingLink( true );
			setOpenedBy( { el: link, action: 'click' } );
		}

		editable.addEventListener( 'click', handleClick, true );

		return () => {
			editable.removeEventListener( 'click', handleClick, true );
		};
	}, [ contentRef, isActive ] );

	function addLink( target ) {
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
		} else if ( ! isActive && text && isPhoneNumber( text ) ) {
			onChange(
				applyFormat( value, {
					type: name,
					attributes: {
						url: `tel:${ text.replace( /\D/g, '' ) }`,
					},
				} )
			);
		} else {
			if ( target ) {
				setOpenedBy( { el: target, action: null } );
			}
			setAddingLink( true );
		}

		// 🔑 Neutralize anchors AFTER DOM updates
		// eslint-disable-next-line @wordpress/react-no-unsafe-timeout
		setTimeout( neutralizeEditorAnchors, 0 );
	}

	function stopAddingLink() {
		setAddingLink( false );

		if ( openedBy?.el?.tagName === 'BUTTON' ) {
			openedBy.el.focus();
		} else {
			onFocus();
		}

		setOpenedBy( null );
	}

	function onFocusOutside() {
		setAddingLink( false );
		setOpenedBy( null );
	}

	function onRemoveFormat() {
		onChange( removeFormat( value, name ) );
		speak( __( 'Link removed.' ), 'assertive' );
	}

	const shouldAutoFocus = ! (
		openedBy?.el?.tagName === 'A' && openedBy?.action === 'click'
	);

	const hasSelection = ! isCollapsed( value );

	return (
		<>
			{ hasSelection && (
				<RichTextShortcut
					type="primary"
					character="k"
					onUse={ addLink }
				/>
			) }
			<RichTextShortcut
				type="primaryShift"
				character="k"
				onUse={ onRemoveFormat }
			/>
			{ isVisible && (
				<RichTextToolbarButton
					name="link"
					icon={ linkIcon }
					title={ isActive ? __( 'Link' ) : title }
					onClick={ ( event ) => addLink( event.currentTarget ) }
					isActive={ isActive || addingLink }
					shortcutType="primary"
					shortcutCharacter="k"
					aria-haspopup="true"
					aria-expanded={ addingLink }
				/>
			) }
			{ isVisible && addingLink && (
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
		class: 'class',
	},
	[ essentialFormatKey ]: true,
	__unstablePasteRule( value, { html, plainText } ) {
		const pastedText = ( html || plainText )
			.replace( /<[^>]+>/g, '' )
			.trim();

		if ( ! isURL( pastedText ) || ! /^https?:/.test( pastedText ) ) {
			return value;
		}

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
