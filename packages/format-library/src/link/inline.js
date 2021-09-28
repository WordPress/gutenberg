/**
 * WordPress dependencies
 */
import { useState, useRef, createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { withSpokenMessages, Popover } from '@wordpress/components';
import { prependHTTP } from '@wordpress/url';
import {
	create,
	insert,
	isCollapsed,
	applyFormat,
	useAnchorRef,
	removeFormat,
} from '@wordpress/rich-text';
import {
	__experimentalLinkControl as LinkControl,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { createLinkFormat, isValidHref } from './utils';
import { link as settings } from './index';

function InlineLinkUI( {
	isActive,
	activeAttributes,
	addingLink,
	value,
	onChange,
	speak,
	stopAddingLink,
	contentRef,
} ) {
	/**
	 * Pending settings to be applied to the next link. When inserting a new
	 * link, toggle values cannot be applied immediately, because there is not
	 * yet a link for them to apply to. Thus, they are maintained in a state
	 * value until the time that the link can be inserted or edited.
	 *
	 * @type {[Object|undefined,Function]}
	 */
	const [ nextLinkValue, setNextLinkValue ] = useState();

	const { createPageEntity, userCanCreatePages } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const _settings = getSettings();

		return {
			createPageEntity: _settings.__experimentalCreatePageEntity,
			userCanCreatePages: _settings.__experimentalUserCanCreatePages,
		};
	}, [] );

	const linkValue = {
		url: activeAttributes.url,
		type: activeAttributes.type,
		id: activeAttributes.id,
		opensInNewTab: activeAttributes.target === '_blank',
		...nextLinkValue,
	};

	function removeLink() {
		const newValue = removeFormat( value, 'core/link' );
		onChange( newValue );
		stopAddingLink();
		speak( __( 'Link removed.' ), 'assertive' );
	}

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
		const format = createLinkFormat( {
			url: newUrl,
			type: nextValue.type,
			id:
				nextValue.id !== undefined && nextValue.id !== null
					? String( nextValue.id )
					: undefined,
			opensInNewWindow: nextValue.opensInNewTab,
		} );

		if ( isCollapsed( value ) && ! isActive ) {
			const newText = nextValue.title || newUrl;
			const toInsert = applyFormat(
				create( { text: newText } ),
				format,
				0,
				newText.length
			);
			onChange( insert( value, toInsert ) );
		} else {
			const newValue = applyFormat( value, format );
			newValue.start = newValue.end;
			newValue.activeFormats = [];
			onChange( newValue );
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

	const anchorRef = useAnchorRef( { ref: contentRef, value, settings } );

	// The focusOnMount prop shouldn't evolve during render of a Popover
	// otherwise it causes a render of the content.
	const focusOnMount = useRef( addingLink ? 'firstElement' : false );

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
				__( 'Create Page: <mark>%s</mark>' ),
				searchTerm
			),
			{ mark: <mark /> }
		);
	}

	return (
		<Popover
			anchorRef={ anchorRef }
			focusOnMount={ focusOnMount.current }
			onClose={ stopAddingLink }
			position="bottom center"
		>
			<LinkControl
				value={ linkValue }
				onChange={ onChangeLink }
				onRemove={ removeLink }
				forceIsEditingLink={ addingLink }
				hasRichPreviews
				createSuggestion={ createPageEntity && handleCreate }
				withCreateSuggestion={ userCanCreatePages }
				createSuggestionButtonText={ createButtonText }
			/>
		</Popover>
	);
}

export default withSpokenMessages( InlineLinkUI );
