/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
import {
	ToolbarButton,
	Button,
	NavigableMenu,
	MenuItem,
	ToggleControl,
	TextControl,
	SVG,
	Path,
	__experimentalVStack as VStack,
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

const expandIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		width="12"
		height="12"
		fill="none"
		viewBox="0 0 12 12"
	>
		<Path
			fill="#000"
			d="M2 0a2 2 0 0 0-2 2v2h1.5V2a.5.5 0 0 1 .5-.5h2V0H2Zm2 10.5H2a.5.5 0 0 1-.5-.5V8H0v2a2 2 0 0 0 2 2h2v-1.5ZM8 12v-1.5h2a.5.5 0 0 0 .5-.5V8H12v2a2 2 0 0 1-2 2H8Zm2-12a2 2 0 0 1 2 2v2h-1.5V2a.5.5 0 0 0-.5-.5H8V0h2Z"
		/>
	</SVG>
);

const unlinkIcon = (
	<SVG
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		width="24"
		height="24"
		aria-hidden="true"
		focusable="false"
	>
		<Path d="M17.031 4.703 15.576 4l-1.56 3H14v.03l-2.324 4.47H9.5V13h1.396l-1.502 2.889h-.95a3.694 3.694 0 0 1 0-7.389H10V7H8.444a5.194 5.194 0 1 0 0 10.389h.17L7.5 19.53l1.416.719L15.049 8.5h.507a3.694 3.694 0 0 1 0 7.39H14v1.5h1.556a5.194 5.194 0 0 0 .273-10.383l1.202-2.304Z"></Path>
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
	lightboxEnabled,
} ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	const openLinkUI = () => {
		setIsOpen( true );
	};

	const [ isEditingLink, setIsEditingLink ] = useState( false );
	const [ urlInput, setUrlInput ] = useState( null );

	const autocompleteRef = useRef( null );

	const startEditLink = () => {
		if (
			linkDestination === LINK_DESTINATION_MEDIA ||
			linkDestination === LINK_DESTINATION_ATTACHMENT
		) {
			setUrlInput( '' );
		}
		setIsEditingLink( true );
	};

	const stopEditLink = () => {
		setIsEditingLink( false );
	};

	const closeLinkUI = () => {
		setUrlInput( null );
		stopEditLink();
		setIsOpen( false );
	};

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

	const onFocusOutside = () => {
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
	};

	const onSubmitLinkChange = () => {
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
					lightbox: { enabled: false },
				} );
			}
			stopEditLink();
			setUrlInput( null );
			event.preventDefault();
		};
	};

	const onLinkRemove = () => {
		onChangeUrl( {
			linkDestination: LINK_DESTINATION_NONE,
			href: '',
		} );
	};

	const getLinkDestinations = () => {
		const linkDestinations = [
			{
				linkDestination: LINK_DESTINATION_MEDIA,
				title: __( 'Link to media file' ),
				url: mediaType === 'image' ? mediaUrl : undefined,
				icon,
			},
		];
		if ( mediaType === 'image' && mediaLink ) {
			linkDestinations.push( {
				linkDestination: LINK_DESTINATION_ATTACHMENT,
				title: __( 'Link to attachment page' ),
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
				linkDestinations.find( ( destination ) => {
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
		<VStack spacing="3">
			<ToggleControl
				__nextHasNoMarginBottom
				label={ __( 'Open in new tab' ) }
				onChange={ onSetNewTab }
				checked={ linkTarget === '_blank' }
			/>
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Link rel' ) }
				value={ rel ?? '' }
				onChange={ onSetLinkRel }
			/>
			<TextControl
				__nextHasNoMarginBottom
				label={ __( 'Link CSS Class' ) }
				value={ linkClass || '' }
				onChange={ onSetLinkClass }
			/>
		</VStack>
	);

	const linkEditorValue = urlInput !== null ? urlInput : url;
	const showLinkEditor = ( ! linkEditorValue && ! lightboxEnabled ) === true;

	const urlLabel = (
		getLinkDestinations().find(
			( destination ) => destination.linkDestination === linkDestination
		) || {}
	).title;

	return (
		<>
			<ToolbarButton
				icon={ linkIcon }
				className="components-toolbar__control"
				label={ url ? __( 'Edit link' ) : __( 'Insert link' ) }
				aria-expanded={ isOpen }
				onClick={ openLinkUI }
				ref={ setPopoverAnchor }
				isActive={ !! url }
			/>
			{ isOpen && (
				<URLPopover
					anchor={ popoverAnchor }
					onFocusOutside={ onFocusOutside() }
					onClose={ closeLinkUI }
					renderSettings={ () => advancedOptions }
					additionalControls={
						showLinkEditor && (
							<NavigableMenu>
								{ getLinkDestinations().map( ( link ) => (
									<MenuItem
										key={ link.linkDestination }
										icon={ link.icon }
										iconPosition="left"
										onClick={ () => {
											setUrlInput( null );
											onSetHref( link.url );
											stopEditLink();
										} }
									>
										{ link.title }
									</MenuItem>
								) ) }
								<MenuItem
									key="expand-on-click"
									icon={ expandIcon }
									iconPosition="left"
									onClick={ () => {
										setUrlInput( null );
										onChangeUrl( {
											lightbox: { enabled: true },
											linkDestination:
												LINK_DESTINATION_NONE,
											href: '',
										} );
										stopEditLink();
									} }
								>
									{ __( 'Expand on click' ) }
								</MenuItem>
							</NavigableMenu>
						)
					}
				>
					{ ( ! url || isEditingLink ) && ! lightboxEnabled && (
						<>
							<URLPopover.LinkEditor
								className="block-editor-format-toolbar__link-container-content"
								value={ linkEditorValue }
								onChangeInputValue={ setUrlInput }
								onSubmit={ onSubmitLinkChange() }
								autocompleteRef={ autocompleteRef }
							/>
						</>
					) }
					{ url && ! isEditingLink && ! lightboxEnabled && (
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
					{ ! url && ! isEditingLink && lightboxEnabled && (
						<>
							<div
								className="block-editor-url-popover__expand-on-click"
								url={ url }
							>
								{ expandIcon }
								<div>
									<p>{ __( 'Expand on click' ) }</p>
									<p>
										{ __(
											'Scales the image with a lightbox effect'
										) }
									</p>
								</div>
								<Button
									icon={ unlinkIcon }
									label={ __( 'Remove link' ) }
									onClick={ () => {
										onChangeUrl( {
											lightbox: { enabled: false },
										} );
									} }
								/>
							</div>
						</>
					) }
				</URLPopover>
			) }
		</>
	);
};

export { ImageURLInputUI as __experimentalImageURLInputUI };
