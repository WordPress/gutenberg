/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { withSpokenMessages, Popover } from '@wordpress/components';
import { prependHTTP } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	getTextContent,
	slice,
} from '@wordpress/rich-text';
import { __experimentalLinkControl as LinkControl } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';

function InlineLinkUI( {
	isActive,
	activeAttributes,
	addingLink,
	value,
	onChange,
	onFocus,
	speak,
	stopAddingLink,
} ) {
	/**
	 * A unique key is generated when switching between editing and not editing
	 * a link, based on:
	 *
	 * - This component may be rendered _either_ when a link is active _or_
	 *   when adding or editing a link.
	 * - It's only desirable to shift focus into the Popover when explicitly
	 *   adding or editing a link, not when in the inline boundary of a link.
	 * - Focus behavior can only be controlled on a Popover at the time it
	 *   mounts, so a new instance of the component must be mounted to
	 *   programmatically enact the focusOnMount behavior.
	 *
	 * @type {string}
	 */
	const mountingKey = useMemo( uniqueId, [ addingLink ] );

	const anchorRef = useMemo( () => {
		const selection = window.getSelection();

		if ( ! selection.rangeCount ) {
			return;
		}

		const range = selection.getRangeAt( 0 );

		if ( addingLink && ! isActive ) {
			return range;
		}

		let element = range.startContainer;

		// If the caret is right before the element, select the next element.
		element = element.nextElementSibling || element;

		while ( element.nodeType !== window.Node.ELEMENT_NODE ) {
			element = element.parentNode;
		}

		return element.closest( 'a' );
	}, [ addingLink, value.start, value.end ] );

	const linkValue = {
		url: activeAttributes.url,
		opensInNewTab: activeAttributes.target === '_blank',
	};

	function onChangeLink( nextValue ) {
		const newUrl = prependHTTP( nextValue.url );
		const selectedText = getTextContent( slice( value ) );
		const format = createLinkFormat( {
			url: newUrl,
			opensInNewWindow: nextValue.opensInNewTab,
			text: selectedText,
		} );

		if ( isCollapsed( value ) && ! isActive ) {
			const toInsert = applyFormat(
				create( { text: newUrl } ),
				format,
				0,
				newUrl.length
			);
			onChange( insert( value, toInsert ) );
		} else {
			onChange( applyFormat( value, format ) );
		}

		onFocus();
		stopAddingLink();

		if ( ! isValidHref( newUrl ) ) {
			speak(
				__(
					'Warning: the link has been inserted but may have errors. Please test it.'
				),
				'assertive'
			);
		} else if ( isActive ) {
			speak( __( 'Link edited.' ), 'assertive' );
		} else {
			speak( __( 'Link inserted.' ), 'assertive' );
		}
	}

	return (
		<Popover
			key={ mountingKey }
			anchorRef={ anchorRef }
			focusOnMount={ addingLink ? 'firstElement' : false }
			onClose={ stopAddingLink }
			position="bottom center"
		>
			<LinkControl value={ linkValue } onChange={ onChangeLink } />
		</Popover>
	);
}

export default withSpokenMessages( InlineLinkUI );
