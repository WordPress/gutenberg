/**
 * External dependencies
 */
import { uniqueId } from 'lodash';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
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

	/**
	 * Pending settings to be applied to the next link. When inserting a new
	 * link, toggle values cannot be applied immediately, because there is not
	 * yet a link for them to apply to. Thus, they are maintained in a state
	 * value until the time that the link can be inserted or edited.
	 *
	 * @type {[Object|undefined,Function]}
	 */
	const [ nextLinkValue, setNextLinkValue ] = useState();

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
		...nextLinkValue,
	};

	function onChangeLink( nextValue ) {
		// Merge with values from state, both for the purpose of assigning the
		// next state value, and for use in constructing the new link format if
		// the link is ready to be applied.
		nextValue = {
			...nextLinkValue,
			...nextValue,
		};

		// LinkControl calls `onChange` immediately upon the toggling a setting.
		const didToggleSetting =
			linkValue.opensInNewTab !== nextValue.opensInNewTab &&
			linkValue.url === nextValue.url;

		// If change handler was called as a result of a settings change during
		// link insertion, it must be held in state until the link is ready to
		// be applied.
		const didToggleSettingForNewLink =
			didToggleSetting && nextValue.url === undefined;

		// If link will be assigned, the state value can be considered flushed.
		// Otherwise, persist the pending changes.
		setNextLinkValue( didToggleSettingForNewLink ? nextValue : undefined );

		if ( didToggleSettingForNewLink ) {
			return;
		}

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

		// Focus should only be shifted back to the formatted segment when the
		// URL is submitted.
		if ( ! didToggleSetting ) {
			stopAddingLink();
		}

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
			<LinkControl
				value={ linkValue }
				onChange={ onChangeLink }
				forceIsEditingLink={ addingLink }
			/>
		</Popover>
	);
}

export default withSpokenMessages( InlineLinkUI );
