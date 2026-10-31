import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { image, linkOff, page } from '@wordpress/icons';
import { CheckboxControl, Stack } from '@wordpress/ui';
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

interface MediaLinkSuggestion {
	id: string;
	title: string;
	url?: string;
}

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
	 * The destinations to offer. The media file and attachment page are only
	 * offered when they have a URL, `none` offers to remove the link, and
	 * `custom` offers page suggestions.
	 */
	destinations?: string[];
	/** Called with the new link when a destination or custom URL is chosen. */
	onChange: ( change: { href?: string; linkDestination: string } ) => void;
}

/**
 * The block inspector's "Link to" field for a block that links to its media:
 * a `LinkPicker` that offers the media file and the attachment page above
 * its page suggestions, with a button to remove the link.
 *
 * @param props                 Component props.
 * @param props.linkDestination The current link destination.
 * @param props.href            The current link URL.
 * @param props.mediaUrl        The media file's URL.
 * @param props.mediaLink       The attachment page's URL.
 * @param props.destinations    The destinations to offer.
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
	const linkPreview = useLinkPreview( { url: href } );

	const destinationUrls = [
		{ linkDestination: LINK_DESTINATION_MEDIA, url: mediaUrl },
		{ linkDestination: LINK_DESTINATION_ATTACHMENT, url: mediaLink },
	];
	const mediaSuggestions = [
		{
			id: LINK_DESTINATION_MEDIA,
			title: __( 'Media file' ),
			url: mediaUrl,
			icon: image,
		},
		{
			id: LINK_DESTINATION_ATTACHMENT,
			title: __( 'Attachment page' ),
			url: mediaLink,
			icon: page,
		},
	].filter(
		( suggestion ) =>
			suggestion.url && destinations.includes( suggestion.id )
	);

	const currentDestination =
		linkDestination ?? getMediaLinkDestination( href, destinationUrls );
	const currentSuggestion = mediaSuggestions.find(
		( suggestion ) => suggestion.id === currentDestination
	);
	const preview = currentSuggestion
		? { ...linkPreview, title: currentSuggestion.title, badges: [] }
		: linkPreview;

	const canChooseCustom = destinations.includes( LINK_DESTINATION_CUSTOM );
	const canRemove =
		destinations.includes( LINK_DESTINATION_NONE ) &&
		currentDestination !== LINK_DESTINATION_NONE;

	return (
		<Stack direction="row" gap="xs" align="flex-end">
			<div className="block-library-media-link-control__picker">
				<LinkPicker
					preview={ preview }
					transformSuggestions={ (
						suggestions: MediaLinkSuggestion[],
						{ searchTerm }: { searchTerm: string }
					) => [
						...mediaSuggestions.filter( ( suggestion ) =>
							suggestion.title
								.toLowerCase()
								.includes( searchTerm.toLowerCase() )
						),
						...( canChooseCustom ? suggestions : [] ),
					] }
					onSelect={ ( { url }: { url?: string } ) =>
						onChange( {
							href: url,
							linkDestination: getMediaLinkDestination(
								url,
								destinationUrls
							),
						} )
					}
					label={ __( 'Link to' ) }
				/>
			</div>
			{ canRemove && (
				<Button
					icon={ linkOff }
					label={ __( 'Remove link' ) }
					size="compact"
					onClick={ () =>
						onChange( {
							href: undefined,
							linkDestination: LINK_DESTINATION_NONE,
						} )
					}
				/>
			) }
		</Stack>
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
