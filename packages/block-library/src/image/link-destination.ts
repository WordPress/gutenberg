export const LINK_DESTINATION_NONE = 'none';
export const LINK_DESTINATION_MEDIA = 'media';
export const LINK_DESTINATION_ATTACHMENT = 'attachment';
export const LINK_DESTINATION_CUSTOM = 'custom';

/**
 * Where the user's last chosen link destination is stored in the preferences
 * store.
 */
export const LINK_DESTINATION_PREFERENCE_SCOPE = 'core/block-library';
export const LINK_DESTINATION_PREFERENCE_NAME = 'imageLinkDestination';

type LinkDestination =
	| typeof LINK_DESTINATION_NONE
	| typeof LINK_DESTINATION_MEDIA
	| typeof LINK_DESTINATION_ATTACHMENT
	| typeof LINK_DESTINATION_CUSTOM;

type RememberedLinkDestination = Exclude<
	LinkDestination,
	typeof LINK_DESTINATION_CUSTOM
>;

const REMEMBERED_LINK_DESTINATIONS: readonly unknown[] = [
	LINK_DESTINATION_NONE,
	LINK_DESTINATION_MEDIA,
	LINK_DESTINATION_ATTACHMENT,
] satisfies RememberedLinkDestination[];

type WindowWithMedia = Window & {
	wp?: {
		media?: { view?: { settings?: { defaultProps?: { link?: string } } } };
	};
};

/**
 * Whether a link destination is one the user's last choice is remembered for.
 * Custom URLs are specific to one image, so they are never remembered.
 *
 * @param linkDestination Link destination to check.
 * @return Whether the link destination can be remembered.
 */
export function isRememberedLinkDestination(
	linkDestination: unknown
): linkDestination is RememberedLinkDestination {
	return REMEMBERED_LINK_DESTINATIONS.includes( linkDestination );
}

/**
 * Returns the default link destination for newly added images: the user's
 * last chosen link destination when there is one, otherwise the site's
 * `image_default_link_type` option.
 *
 * @param rememberedLinkDestination The user's last chosen link destination,
 *                                  from the preferences store.
 * @return Block link destination.
 */
export function getDefaultLinkDestination(
	rememberedLinkDestination?: unknown
): LinkDestination {
	if ( isRememberedLinkDestination( rememberedLinkDestination ) ) {
		return rememberedLinkDestination;
	}

	switch (
		( window as WindowWithMedia ).wp?.media?.view?.settings?.defaultProps
			?.link
	) {
		case 'file':
			return LINK_DESTINATION_MEDIA;
		case 'post':
			return LINK_DESTINATION_ATTACHMENT;
		case LINK_DESTINATION_CUSTOM:
			return LINK_DESTINATION_CUSTOM;
		default:
			return LINK_DESTINATION_NONE;
	}
}
