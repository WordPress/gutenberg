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
	ToolbarButton,
	Button,
	NavigableMenu,
	MenuItem,
	ToggleControl,
	TextControl,
	SVG,
	Path,
} from '@wordpress/components';
import { link as linkIcon, close } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import URLPopover from './index';

const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_CUSTOM = 'custom';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const NEW_TAB_REL = [ 'noreferrer', 'noopener' ];

const icon = (
	<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
		<Path d="M0,0h24v24H0V0z" fill="none" />
		<Path d="m19 5v14h-14v-14h14m0-2h-14c-1.1 0-2 0.9-2 2v14c0 1.1 0.9 2 2 2h14c1.1 0 2-0.9 2-2v-14c0-1.1-0.9-2-2-2z" />
		<Path d="m14.14 11.86l-3 3.87-2.14-2.59-3 3.86h12l-3.86-5.14z" />
	</SVG>
);

const ImageURLInputUI = ( {
	linkDestination,
	onChangeUrl,
	url,
	mediaType = 'image',
	mediaUrl,
	mediaLink,
	linkTarget,
	linkClass,
	rel,
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const openLinkUI = useCallback( () => {
		setIsOpen( true );
	} );

	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const autocompleteRef = useRef( null );

	const startEditLink = useCallback( () => {
		if (
			linkDestination === LINK_DESTINATION_MEDIA ||
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

	const getUpdatedLinkTargetSettings = ( value ) => {
		const newLinkTarget = value ? '_blank' : undefined;

		let updatedRel;
		if ( newLinkTarget ) {
			const rels = ( rel ?? '' ).split( ' ' );
			NEW_TAB_REL.forEach( ( relVal ) => {
				if ( ! rels.includes( relVal ) ) {
					rels.push( relVal );
				}
			} );
			updatedRel = rels.join( ' ' );
		} else {
			const rels = ( rel ?? '' )
				.split( ' ' )
				.filter(
					( relVal ) => NEW_TAB_REL.includes( relVal ) === false
				);
			updatedRel = rels.length ? rels.join( ' ' ) : undefined;
		}

		return {
			linkTarget: newLinkTarget,
			rel: updatedRel,
		};
	};

	const onFocusOutside = useCallback( () => {
		return ( event ) => {
			// The autocomplete suggestions list renders in a separate popover (in a portal),
			// so onFocusOutside fails to detect that a click on a suggestion occurred in the
			// LinkContainer. Detect clicks on autocomplete suggestions using a ref here, and
			// return to avoid the popover being closed.
			const autocompleteElement = autocompleteRef.current;
			if (
				autocompleteElement &&
				autocompleteElement.contains( event.target )
			) {
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
				// It is possible the entered URL actually matches a named link destination.
				// This check will ensure our link destination is correct.
				const selectedDestination =
					getLinkDestinations().find(
						( destination ) => destination.url === urlInput
					)?.linkDestination || LINK_DESTINATION_CUSTOM;

				onChangeUrl( {
					href: urlInput,
					linkDestination: selectedDestination,
				} );
			}
			stopEditLink();
			setUrlInput( null );
			event.preventDefault();
		};
	} );

	const onLinkRemove = useCallback( () => {
		onChangeUrl( {
			linkDestination: LINK_DESTINATION_NONE,
			href: '',
		} );
	} );

	const getLinkDestinations = () => {
		const linkDestinations = [
			{
				linkDestination: LINK_DESTINATION_MEDIA,
				title: __( 'Media File' ),
				url: mediaType === 'image' ? mediaUrl : undefined,
				icon,
			},
		];
		if ( mediaType === 'image' && mediaLink ) {
			linkDestinations.push( {
				linkDestination: LINK_DESTINATION_ATTACHMENT,
				title: __( 'Attachment Page' ),
				url: mediaType === 'image' ? mediaLink : undefined,
				icon: (
					<SVG viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
						<Path d="M0 0h24v24H0V0z" fill="none" />
						<Path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
					</SVG>
				),
			} );
		}
		return linkDestinations;
	};

	const onSetHref = ( value ) => {
		const linkDestinations = getLinkDestinations();
		let linkDestinationInput;
		if ( ! value ) {
			linkDestinationInput = LINK_DESTINATION_NONE;
		} else {
			linkDestinationInput = (
				find( linkDestinations, ( destination ) => {
					return destination.url === value;
				} ) || { linkDestination: LINK_DESTINATION_CUSTOM }
			).linkDestination;
		}
		onChangeUrl( {
			linkDestination: linkDestinationInput,
			href: value,
		} );
	};

	const onSetNewTab = ( value ) => {
		const updatedLinkTarget = getUpdatedLinkTargetSettings( value );
		onChangeUrl( updatedLinkTarget );
	};

	const onSetLinkRel = ( value ) => {
		onChangeUrl( { rel: value } );
	};

	const onSetLinkClass = ( value ) => {
		onChangeUrl( { linkClass: value } );
	};

	const advancedOptions = (
		<>
			<ToggleControl
				label={ __( 'Open in new tab' ) }
				onChange={ onSetNewTab }
				checked={ linkTarget === '_blank' }
			/>
			<TextControl
				label={ __( 'Link Rel' ) }
				value={ rel ?? '' }
				onChange={ onSetLinkRel }
			/>
			<TextControl
				label={ __( 'Link CSS Class' ) }
				value={ linkClass || '' }
				onChange={ onSetLinkClass }
			/>
		</>
	);

	const linkEditorValue = urlInput !== null ? urlInput : url;

	const urlLabel = (
		find( getLinkDestinations(), [ 'linkDestination', linkDestination ] ) ||
		{}
	).title;

	return (
		<>
			<ToolbarButton
				icon={ linkIcon }
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
					additionalControls={
						! linkEditorValue && (
							<NavigableMenu>
								{ map( getLinkDestinations(), ( link ) => (
									<MenuItem
										key={ link.linkDestination }
										icon={ link.icon }
										onClick={ () => {
											setUrlInput( null );
											onSetHref( link.url );
											stopEditLink();
										} }
									>
										{ link.title }
									</MenuItem>
								) ) }
							</NavigableMenu>
						)
					}
				>
					{ ( ! url || isEditingLink ) && (
						<URLPopover.LinkEditor
							className="block-editor-format-toolbar__link-container-content"
							value={ linkEditorValue }
							onChangeInputValue={ setUrlInput }
							onSubmit={ onSubmitLinkChange() }
							autocompleteRef={ autocompleteRef }
						/>
					) }
					{ url && ! isEditingLink && (
						<>
							<URLPopover.LinkViewer
								className="block-editor-format-toolbar__link-container-content"
								url={ url }
								onEditLinkClick={ startEditLink }
								urlLabel={ urlLabel }
							/>
							<Button
								icon={ close }
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

export { ImageURLInputUI as __experimentalImageURLInputUI };
