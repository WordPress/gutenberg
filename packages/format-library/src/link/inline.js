/**
 * WordPress dependencies
 */
import { useMemo, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { Popover } from '@wordpress/components';
import { prependHTTP } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	removeFormat,
	slice,
	replace,
	split,
	concat,
	useAnchor,
} from '@wordpress/rich-text';
import {
	__experimentalLinkControl as LinkControl,
	store as blockEditorStore,
	useCachedTruthy,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref, getFormatBoundary } from './utils';
import { link as settings } from './index';

const LINK_SETTINGS = [
	...LinkControl.DEFAULT_LINK_SETTINGS,
	{
		id: 'nofollow',
		title: __( 'Mark as nofollow' ),
	},
];

function InlineLinkUI( {
	isActive,
	activeAttributes,
	value,
	onChange,
	onFocusOutside,
	stopAddingLink,
	contentRef,
} ) {
	const richLinkTextValue = getRichTextValueFromSelection( value, isActive );

	// Get the text content minus any HTML tags.
	const richTextText = richLinkTextValue.text;

	const { createPageEntity, userCanCreatePages } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const _settings = getSettings();

		return {
			createPageEntity: _settings.__experimentalCreatePageEntity,
			userCanCreatePages: _settings.__experimentalUserCanCreatePages,
		};
	}, [] );

	const linkValue = useMemo(
		() => ( {
			url: activeAttributes.url,
			type: activeAttributes.type,
			id: activeAttributes.id,
			opensInNewTab: activeAttributes.target === '_blank',
			nofollow: activeAttributes.rel?.includes( 'nofollow' ),
			title: richTextText,
		} ),
		[
			activeAttributes.id,
			activeAttributes.rel,
			activeAttributes.target,
			activeAttributes.type,
			activeAttributes.url,
			richTextText,
		]
	);

	function removeLink() {
		const newValue = removeFormat( value, 'core/link' );
		onChange( newValue );
		stopAddingLink();
		speak( __( 'Link removed.' ), 'assertive' );
	}

	function onChangeLink( nextValue ) {
		const hasLink = linkValue?.url;
		const isNewLink = ! hasLink;

		// Merge the next value with the current link value.
		nextValue = {
			...linkValue,
			...nextValue,
		};

		const newUrl = prependHTTP( nextValue.url );
		const linkFormat = createLinkFormat( {
			url: newUrl,
			type: nextValue.type,
			id:
				nextValue.id !== undefined && nextValue.id !== null
					? String( nextValue.id )
					: undefined,
			opensInNewWindow: nextValue.opensInNewTab,
			nofollow: nextValue.nofollow,
		} );

		const newText = nextValue.title || newUrl;

		if ( isCollapsed( value ) && ! isActive ) {
			// Scenario: we don't have any actively selected text or formats.
			const toInsert = applyFormat(
				create( { text: newText } ),
				linkFormat,
				0,
				newText.length
			);
			onChange( insert( value, toInsert ) );
		} else {
			// Scenario: we have any active text selection or an active format.
			let newValue;

			if ( newText === richTextText ) {
				// If we're not updating the text then ignore.
				newValue = applyFormat( value, linkFormat );
			} else {
				// Create new RichText value for the new text in order that we
				// can apply formats to it.
				newValue = create( { text: newText } );

				// Apply the new Link format to this new text value.
				newValue = applyFormat(
					newValue,
					linkFormat,
					0,
					newText.length
				);

				// Get the boundaries of the active link format.
				const boundary = getFormatBoundary( value, {
					type: 'core/link',
				} );

				// Split the value at the start of the active link format.
				// Passing "start" as the 3rd parameter is required to ensure
				// the second half of the split value is split at the format's
				// start boundary and avoids relying on the value's "end" property
				// which may not correspond correctly.
				const [ valBefore, valAfter ] = split(
					value,
					boundary.start,
					boundary.start
				);

				// Update the original (full) RichTextValue replacing the
				// target text with the *new* RichTextValue containing:
				// 1. The new text content.
				// 2. The new link format.
				// As "replace" will operate on the first match only, it is
				// run only against the second half of the value which was
				// split at the active format's boundary. This avoids a bug
				// with incorrectly targetted replacements.
				// See: https://github.com/WordPress/gutenberg/issues/41771.
				// Note original formats will be lost when applying this change.
				// That is expected behaviour.
				// See: https://github.com/WordPress/gutenberg/pull/33849#issuecomment-936134179.
				const newValAfter = replace( valAfter, richTextText, newValue );

				newValue = concat( valBefore, newValAfter );
			}

			onChange( newValue );
		}

		// Focus should only be returned to the rich text on submit if this link is not
		// being created for the first time. If it is then focus should remain within the
		// Link UI because it should remain open for the user to modify the link they have
		// just created.
		if ( ! isNewLink ) {
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

	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings,
	} );

	//  As you change the link by interacting with the Link UI
	//  the return value of document.getSelection jumps to the field you're editing,
	//  not the highlighted text. Given that useAnchor uses document.getSelection,
	//  it will return null, since it can't find the <mark> element within the Link UI.
	//  This caches the last truthy value of the selection anchor reference.
	// This ensures the Popover is positioned correctly on initial submission of the link.
	const cachedRect = useCachedTruthy( popoverAnchor.getBoundingClientRect() );

	// If the link is not active (i.e. it is a new link) then we need to
	// override the getBoundingClientRect method on the anchor element
	// to return the cached value of the selection represented by the text
	// that the user selected to be linked.
	// If the link is active (i.e. it is an existing link) then we allow
	// the default behaviour of the popover anchor to be used. This will get
	// the anchor based on the `<a>` element in the rich text.
	if ( ! isActive ) {
		popoverAnchor.getBoundingClientRect = () => cachedRect;
	}

	async function handleCreate( pageTitle ) {
		const page = await createPageEntity( {
			title: pageTitle,
			status: 'draft',
		} );

		return {
			id: page.id,
			type: page.type,
			title: page.title.rendered,
			url: page.link,
			kind: 'post-type',
		};
	}

	function createButtonText( searchTerm ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %s: search term. */
				__( 'Create page: <mark>%s</mark>' ),
				searchTerm
			),
			{ mark: <mark /> }
		);
	}

	return (
		<Popover
			anchor={ popoverAnchor }
			onClose={ stopAddingLink }
			onFocusOutside={ onFocusOutside }
			placement="bottom"
			offset={ 10 }
			shift
		>
			<LinkControl
				value={ linkValue }
				onChange={ onChangeLink }
				onRemove={ removeLink }
				hasRichPreviews
				createSuggestion={ createPageEntity && handleCreate }
				withCreateSuggestion={ userCanCreatePages }
				createSuggestionButtonText={ createButtonText }
				hasTextControl
				settings={ LINK_SETTINGS }
				showInitialSuggestions={ true }
				suggestionsQuery={ {
					// always show Pages as initial suggestions
					initialSuggestionsSearchOptions: {
						type: 'post',
						subtype: 'page',
						perPage: 20,
					},
				} }
			/>
		</Popover>
	);
}

function getRichTextValueFromSelection( value, isActive ) {
	// Default to the selection ranges on the RichTextValue object.
	let textStart = value.start;
	let textEnd = value.end;

	// If the format is currently active then the rich text value
	// should always be taken from the bounds of the active format
	// and not the selected text.
	if ( isActive ) {
		const boundary = getFormatBoundary( value, {
			type: 'core/link',
		} );

		textStart = boundary.start;

		// Text *selection* always extends +1 beyond the edge of the format.
		// We account for that here.
		textEnd = boundary.end + 1;
	}

	// Get a RichTextValue containing the selected text content.
	return slice( value, textStart, textEnd );
}

export default InlineLinkUI;
