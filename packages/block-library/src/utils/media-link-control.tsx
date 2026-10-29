import { SelectControl as WCSelectControl } from '@wordpress/components';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { CheckboxControl } from '@wordpress/ui';
import { useLinkPreview } from './link-picker';
import { unlock } from '../lock-unlock';

const { LinkPicker, getMediaLinkDestination, getNewTabLinkAttributes } = unlock(
	blockEditorPrivateApis
);

// The Image block's link destinations.
const LINK_DESTINATION_NONE = 'none';
const LINK_DESTINATION_MEDIA = 'media';
const LINK_DESTINATION_ATTACHMENT = 'attachment';
const LINK_DESTINATION_CUSTOM = 'custom';

const ALL_DESTINATIONS = [
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_ATTACHMENT,
	LINK_DESTINATION_CUSTOM,
];

interface MediaLinkControlProps {
	/**
	 * The current link destination: `none`, `media`, `attachment` or
	 * `custom`. Without one, it is worked out from `href`.
	 */
	linkDestination?: string;
	/** The current link URL. */
	href?: string;
	/** The media file's URL, which the `media` destination links to. */
	mediaUrl?: string;
	/** The attachment page's URL, which the `attachment` destination links to. */
	mediaLink?: string;
	/**
	 * The destinations to offer, in order. The media file and attachment page
	 * are only offered when they have a URL.
	 */
	destinations?: string[];
	/** Called with the new link when a destination or custom URL is chosen. */
	onChange: ( change: { href?: string; linkDestination: string } ) => void;
}

/**
 * The block inspector's "Link to" field for a block that links to its media:
 * no link, the media file, the attachment page, or a custom URL chosen with
 * a `LinkPicker`.
 *
 * @param props                 Component props.
 * @param props.linkDestination The current link destination.
 * @param props.href            The current link URL.
 * @param props.mediaUrl        The media file's URL.
 * @param props.mediaLink       The attachment page's URL.
 * @param props.destinations    The destinations to offer, in order.
 * @param props.onChange        Called with the new link.
 */
export function MediaLinkControl( {
	linkDestination,
	href,
	mediaUrl,
	mediaLink,
	destinations = ALL_DESTINATIONS,
	onChange,
}: MediaLinkControlProps ) {
	// Custom URL stays chosen while the user picks a URL, without changing
	// the link until they do.
	const [ isChoosingCustomUrl, setIsChoosingCustomUrl ] = useState( false );
	const preview = useLinkPreview( { url: href } );

	const destinationUrls = [
		{ linkDestination: LINK_DESTINATION_MEDIA, url: mediaUrl },
		{ linkDestination: LINK_DESTINATION_ATTACHMENT, url: mediaLink },
	];
	const labels: Record< string, string > = {
		[ LINK_DESTINATION_NONE ]: __( 'None' ),
		[ LINK_DESTINATION_MEDIA ]: __( 'Media file' ),
		[ LINK_DESTINATION_ATTACHMENT ]: __( 'Attachment page' ),
		[ LINK_DESTINATION_CUSTOM ]: __( 'Custom URL' ),
	};
	const options = destinations
		.filter(
			( destination ) =>
				( destination !== LINK_DESTINATION_MEDIA || mediaUrl ) &&
				( destination !== LINK_DESTINATION_ATTACHMENT || mediaLink )
		)
		.map( ( destination ) => ( {
			value: destination,
			label: labels[ destination ],
		} ) );

	const currentDestination = isChoosingCustomUrl
		? LINK_DESTINATION_CUSTOM
		: ( linkDestination ??
			getMediaLinkDestination( href, destinationUrls ) );

	const onChangeDestination = ( destination: string ) => {
		if ( destination === LINK_DESTINATION_CUSTOM ) {
			setIsChoosingCustomUrl( true );
			return;
		}
		setIsChoosingCustomUrl( false );
		onChange( {
			href: destinationUrls.find(
				( destinationUrl ) =>
					destinationUrl.linkDestination === destination
			)?.url,
			linkDestination: destination,
		} );
	};

	return (
		<>
			<WCSelectControl
				__next40pxDefaultSize
				label={ __( 'Link to' ) }
				value={ currentDestination }
				options={ options }
				onChange={ onChangeDestination }
			/>
			{ currentDestination === LINK_DESTINATION_CUSTOM && (
				<LinkPicker
					preview={ preview }
					onSelect={ ( { url }: { url?: string } ) => {
						setIsChoosingCustomUrl( false );
						onChange( {
							href: url,
							linkDestination: getMediaLinkDestination(
								url,
								destinationUrls
							),
						} );
					} }
					label={ __( 'URL' ) }
				/>
			) }
		</>
	);
}

interface MediaLinkNewTabControlProps {
	/** The link's current target. */
	linkTarget?: string;
	/** The link's current rel. */
	rel?: string;
	/** Called with the new link target and rel. */
	onChange: ( change: { linkTarget?: string; rel?: string } ) => void;
}

/**
 * The block inspector's "Open in new tab" field for a block that links to its
 * media. Opening in a new tab adds `noopener` to the link's rel.
 *
 * @param props            Component props.
 * @param props.linkTarget The link's current target.
 * @param props.rel        The link's current rel.
 * @param props.onChange   Called with the new link target and rel.
 */
export function MediaLinkNewTabControl( {
	linkTarget,
	rel,
	onChange,
}: MediaLinkNewTabControlProps ) {
	return (
		<CheckboxControl
			label={ __( 'Open in new tab' ) }
			checked={ linkTarget === '_blank' }
			onCheckedChange={ ( value: boolean ) =>
				onChange( getNewTabLinkAttributes( value, rel ) )
			}
		/>
	);
}
