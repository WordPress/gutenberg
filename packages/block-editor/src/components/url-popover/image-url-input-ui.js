/**
 * External dependencies
 */
import { find, map } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState, useCallback } from '@wordpress/element';
import {
	IconButton,
	NavigableMenu,
	MenuItem,
} from '@wordpress/components';
import {
	LEFT,
	RIGHT,
	UP,
	DOWN,
	BACKSPACE,
	ENTER,
} from '@wordpress/keycodes';

/**
 * Internal dependencies
 */
import URLPopover from './index';

export const LINK_DESTINATION_NONE = 'none';
export const LINK_DESTINATION_CUSTOM = 'custom';
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
export const NEW_TAB_REL = [ 'noreferrer', 'noopener' ];

const stopPropagation = ( event ) => {
	event.stopPropagation();
};

const stopPropagationRelevantKeys = ( event ) => {
	if ( [ LEFT, DOWN, RIGHT, UP, BACKSPACE, ENTER ].indexOf( event.keyCode ) > -1 ) {
		// Stop the key event from propagating up to ObserveTyping.startTypingInTextField.
		event.stopPropagation();
	}
};

const ImageURLInputUI = ( {
	advancedOptions,
	linkDestination,
	mediaLinks,
	onChangeUrl,
	url,
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const startEditLink = useCallback( () => {
		if ( linkDestination === LINK_DESTINATION_MEDIA ||
			linkDestination === LINK_DESTINATION_ATTACHMENT
		) {
			setUrlInput( '' );
		}
		setIsEditingLink( true );
	} );
	const stopEditLink = useCallback( () => {
		setIsEditingLink( false );
	} );

	const closeLinkUI = useCallback( () => {
		setUrlInput( null );
		stopEditLink();
		setIsOpen( false );
	} );

	const autocompleteRef = useRef( null );

	const onFocusOutside = useCallback( () => {
		return ( event ) => {
			// The autocomplete suggestions list renders in a separate popover (in a portal),
			// so onFocusOutside fails to detect that a click on a suggestion occurred in the
			// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
			// return to avoid the popover being closed.
			const autocompleteElement = autocompleteRef.current;
			if ( autocompleteElement && autocompleteElement.contains( event.target ) ) {
				return;
			}
			setIsOpen( false );
			setUrlInput( null );
			stopEditLink();
		};
	} );

	const onSubmitLinkChange = useCallback( () => {
		return ( event ) => {
			if ( urlInput ) {
				onChangeUrl( urlInput );
			}
			stopEditLink();
			setUrlInput( null );
			event.preventDefault();
		};
	} );

	const onLinkRemove = useCallback( () => {
		closeLinkUI();
		onChangeUrl( '' );
	} );
	const linkEditorValue = urlInput !== null ? urlInput : url;

	const urlLabel = (
		find( mediaLinks, [ 'linkDestination', linkDestination ] ) || {}
	).title;
	return (
		<>
			<IconButton
				icon="admin-links"
				className="components-toolbar__control"
				label={ url ? __( 'Edit link' ) : __( 'Insert link' ) }
				aria-expanded={ isOpen }
				onClick={ openLinkUI }
			/>
			{ isOpen && (
				<URLPopover
					onFocusOutside={ onFocusOutside() }
					onClose={ closeLinkUI }
					renderSettings={ () => advancedOptions }
					additionalControls={ ! linkEditorValue && (
						<NavigableMenu>
							{
								map( mediaLinks, ( link ) => (
									<MenuItem
										key={ link.linkDestination }
										icon={ link.icon }
										onClick={ () => {
											setUrlInput( null );
											onChangeUrl( link.url );
											stopEditLink();
										} }
									>
										{ link.title }
									</MenuItem>
								) )
							}
						</NavigableMenu>
					) }
				>
					{ ( ! url || isEditingLink ) && (
						<URLPopover.LinkEditor
							className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
							value={ linkEditorValue }
							onChangeInputValue={ setUrlInput }
							onKeyDown={ stopPropagationRelevantKeys }
							onKeyPress={ stopPropagation }
							onSubmit={ onSubmitLinkChange() }
							autocompleteRef={ autocompleteRef }
						/>
					) }
					{ ( url && ! isEditingLink ) && (
						<>
							<URLPopover.LinkViewer
								className="editor-format-toolbar__link-container-content block-editor-format-toolbar__link-container-content"
								onKeyPress={ stopPropagation }
								url={ url }
								onEditLinkClick={ startEditLink }
								urlLabel={ urlLabel }
							/>
							<IconButton
								icon="no"
								label={ __( 'Remove link' ) }
								onClick={ onLinkRemove }
							/>
						</>
					) }
				</URLPopover>
			) }
		</>
	);
};

export {
	ImageURLInputUI as __experimentalImageURLInputUI,
	stopPropagation,
	stopPropagationRelevantKeys,
};
