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

const linkFormatAttributes = applyFilters( 'editor.linkFormat.attributes', {
	url: 'href',
	type: 'data-type',
	id: 'data-id',
	noFollow: {
		target: 'rel',
		toFormat( relAttribute ) {
			// Set the Boolean value of the `noFollow` prop
			// based on the whether the HTML `rel` attribute contains
			// `nofollow`.
			return relAttribute?.split( ' ' )?.includes( 'nofollow' );
		},
		toElement( noFollowAttribute, allElementAttributes ) {
			const currentRelOrEmpty = allElementAttributes?.rel ?? '';

			const rel = ( currentRelOrEmpty + ' nofollow' ).trim();

			return {
				...allElementAttributes,
				// if `noFollow` is true then add a rel
				// attribute to any existing rel attr.
				...( noFollowAttribute && { rel } ),
			};
		},
	},
	opensInNewTab: {
		target: 'target',
		toFormat( targetAttribute ) {
			// Set the Boolean value of the `noFollow` prop
			// based on the whether the HTML `rel` attribute contains
			// `nofollow`.
			return targetAttribute?.split( ' ' )?.includes( '_blank' );
		},
		toElement( opensInNewTabAttribute, elementAttributes ) {
			const currentRelOrEmpty = elementAttributes?.rel ?? '';

			const rel = ( currentRelOrEmpty + ' noreferrer noopener' ).trim();

			return {
				...elementAttributes,
				...( opensInNewTabAttribute && { target: '_blank' } ),
				// if `noFollow` is true then add the related `rel`
				// attributes to any existing rel attr.
				...( opensInNewTabAttribute && { rel } ),
			};
		},
	},
} );

addFilter(
	'editor.linkFormat.inlineLinkControlSettings',
	'core',
	function ( settings ) {
		settings.push( {
			id: 'noFollow',
			title: 'Mark as "nofollow"',
		} );
		return settings;
	}
);

export const link = {
	name,
	title,
	tagName: 'a',
	className: null,
	attributes: linkFormatAttributes,
	__experimentalToLinkValue(
		activeAttributes,
		richTextText,
		pendingLinkValueChanges
	) {
		return {
			...activeAttributes,
			url: activeAttributes.url,
			type: activeAttributes.type,
			id: activeAttributes.id,
			// opensInNewTab: activeAttributes.target === '_blank',
			title: richTextText,
			// Todo - perhaps pending changes can be applied later.
			...pendingLinkValueChanges,
		};
	},

	// Defines how to generate the format object (that will be applied to the link text)
	// from a LinkControl value object.
	// TODO: we need TypeScript here to define the type of `options`.
	__experimentalToLinkFormat( options ) {
		const {
			url,
			type,
			id,
			// eslint
			title: __IGNORED, // eslint-disable-line no-unused-vars
			...otherOptions
		} = options;
		const newUrl = prependHTTP( url );

		const newId =
			id !== undefined && id !== null ? String( id ) : undefined;

		const format = {
			type: 'core/link',
			attributes: {
				url: newUrl,
			},
		};

		format.attributes = {
			...format.attributes,
			...otherOptions,
		};

		if ( type ) format.attributes.type = type;
		if ( newId ) format.attributes.id = newId;

		// Bug where this will be overwritten because `_target` is included in ...otherOptions
		// Also means the object based attribute format will not work for more complex
		// cases.
		// if ( opensInNewTab ) {
		// 	const currentRelOrEmpty = format.attributes?.rel ?? '';
		// 	format.attributes.target = '_blank';
		// 	format.attributes.rel = (
		// 		currentRelOrEmpty + ' noreferrer noopener'
		// 	).trim();
		// }

		return format;
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
