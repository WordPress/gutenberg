/**
 * WordPress dependencies
 */
import type { Attachment, Updatable, Post, User } from '@wordpress/core-data';

export type MediaKind = 'image' | 'video' | 'audio' | 'application';

export interface MediaType {
	type: MediaKind;
	label: string;
	icon: JSX.Element;
}

// TODO: Update the Attachment type separately.
export interface MediaItem extends Attachment< 'edit' > {
	// featured_media is not in the Attachment type. See https://github.com/WordPress/gutenberg/blob/trunk/packages/core-data/src/entity-types/attachment.ts#L10
	featured_media: number;
	_embedded?: {
		// TODO: Include wp:attached-to properly, and backport PHP changes from wordpress-develop to support this.
		'wp:attached-to'?: Post[] | Partial< Post >[];
		author?: User[] | Partial< User >[];
	};
}

export type MediaItemUpdatable = Updatable< Attachment >;
