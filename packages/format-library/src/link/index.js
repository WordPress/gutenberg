/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import {
	getTextContent,
	applyFormat,
	removeFormat,
	slice,
	isCollapsed,
} from '@wordpress/rich-text';
import { isURL, isEmail } from '@wordpress/url';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { link as linkIcon, linkOff } from '@wordpress/icons';
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

	function stopAddingLink() {
		setAddingLink( false );
		onFocus();
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
			{ isActive && (
				<RichTextToolbarButton
					name="link"
					icon={ linkOff }
					title={ __( 'Unlink' ) }
					onClick={ onRemoveFormat }
					isActive={ isActive }
					shortcutType="primaryShift"
					shortcutCharacter="k"
				/>
			) }
			{ ! isActive && (
				<RichTextToolbarButton
					name="link"
					icon={ linkIcon }
					title={ title }
					onClick={ addLink }
					isActive={ isActive }
					shortcutType="primary"
					shortcutCharacter="k"
				/>
			) }
			{ ( addingLink || isActive ) && (
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
		target: 'target',
	},
	__unstablePasteRule( value, { html, plainText } ) {
		if ( isCollapsed( value ) ) {
			return value;
		}

		const pastedText = ( html || plainText )
			.replace( /<[^>]+>/g, '' )
			.trim();

		// A URL was pasted, turn the selection into a link.
		if ( ! isURL( pastedText ) ) {
			return value;
		}

		// Allows us to ask for this information when we get a report.
		window.console.log( 'Created link:\n\n', pastedText );

		return applyFormat( value, {
			type: name,
			attributes: {
				url: decodeEntities( pastedText ),
			},
		} );
	},
	edit: Edit,
};
