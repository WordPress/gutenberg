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
import { isURL, isEmail, prependHTTP } from '@wordpress/url';
import {
	RichTextToolbarButton,
	RichTextShortcut,
} from '@wordpress/block-editor';
import { decodeEntities } from '@wordpress/html-entities';
import { link as linkIcon, linkOff } from '@wordpress/icons';
import { speak } from '@wordpress/a11y';
import { applyFilters, addFilter } from '@wordpress/hooks';

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
	attributes: applyFilters( 'editor.linkFormat.attributes', {
		url: 'href',
		type: 'data-type',
		id: 'data-id',
		target: 'target',
	} ),
	__experimentalToLinkValue(
		activeAttributes,
		richTextText,
		pendingLinkValueChanges
	) {
		const linkValue = {
			url: activeAttributes.url,
			type: activeAttributes.type,
			id: activeAttributes.id,
			opensInNewTab: activeAttributes.target === '_blank',
			title: richTextText,
			// Todo - perhaps pending changes can be applied later.
			...pendingLinkValueChanges,
		};

		return applyFilters(
			'editor.linkFormat.toLinkValue',
			linkValue,
			activeAttributes,
			pendingLinkValueChanges
		);
	},

	// Defines how to generate the format object (that will be applied to the link text)
	// from a LinkControl value object.
	// TODO: we need TypeScript here to define the type of `options`.
	__experimentalToLinkFormat( options ) {
		const { url, type, id, opensInNewTab } = options;

		const newUrl = prependHTTP( url );

		const newId =
			id !== undefined && id !== null ? String( id ) : undefined;

		const format = {
			type: 'core/link',
			attributes: {
				url: newUrl,
			},
		};

		if ( type ) format.attributes.type = type;
		if ( newId ) format.attributes.id = newId;

		if ( opensInNewTab ) {
			const currentRelOrEmpty = format.attributes?.rel ?? '';
			format.attributes.target = '_blank';
			format.attributes.rel = (
				currentRelOrEmpty + ' noreferrer noopener'
			).trim();
		}

		return applyFilters(
			'editor.linkFormat.toLinkFormat',
			format,
			options
		);
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

// TODO - REVOVE, testing only.

// Handle converting `rel="nofollow"` into the `noFollow` setting on the Link Value
addFilter(
	'editor.linkFormat.toLinkValue',
	'core',
	function ( linkValue, activeAttributes ) {
		linkValue.noFollow = activeAttributes?.rel?.includes( 'nofollow' );
		return linkValue;
	}
);

// Handle converting `noFollow` of link value setting to `rel="nofollow"` attribute.
addFilter(
	'editor.linkFormat.toLinkFormat',
	'core',
	function ( format, nextValue ) {
		const currentRelOrEmpty = format.attributes?.rel ?? '';
		if ( nextValue.noFollow ) {
			format.attributes = {
				...format.attributes,
				rel: ( currentRelOrEmpty + ' nofollow' ).trim(),
			};
		}
		return format;
	}
);

// Add 'rel' as a default attribute of `core/link` format.
addFilter( 'editor.linkFormat.attributes', 'core', function ( attrs ) {
	attrs.rel = 'rel';
	return attrs;
} );
