export const LINK_DESTINATION_NONE = 'none';
export const LINK_DESTINATION_CUSTOM = 'custom';
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
const NEW_TAB_REL = [ 'noopener' ];

/**
 * A named place a media block can link to, such as its media file.
 */
export interface MediaLinkDestinationURL {
	linkDestination: string;
	url?: string;
}

/**
 * Returns the link destination of a media block's link: `none` when there is
 * no link, the named destination whose URL it matches, or `custom`.
 *
 * @param url          The link URL.
 * @param destinations The named destinations and their URLs.
 * @return The link destination.
 */
export function getMediaLinkDestination(
	url: string | undefined,
	destinations: MediaLinkDestinationURL[]
): string {
	if ( ! url ) {
		return LINK_DESTINATION_NONE;
	}
	return (
		destinations.find( ( destination ) => destination.url === url )
			?.linkDestination || LINK_DESTINATION_CUSTOM
	);
}

/**
 * Returns the link target and rel of a link that opens, or stops opening, in
 * a new tab. A new tab adds `noopener` to the rel, and closing it removes it.
 *
 * @param openInNewTab Whether the link opens in a new tab.
 * @param rel          The link's current rel.
 * @return The link target and rel.
 */
export function getNewTabLinkAttributes(
	openInNewTab: boolean,
	rel?: string
): { linkTarget?: string; rel?: string } {
	const linkTarget = openInNewTab ? '_blank' : undefined;

	let updatedRel;
	if ( linkTarget ) {
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
			.filter( ( relVal ) => NEW_TAB_REL.includes( relVal ) === false );
		updatedRel = rels.length ? rels.join( ' ' ) : undefined;
	}

	return {
		linkTarget,
		rel: updatedRel,
	};
}
