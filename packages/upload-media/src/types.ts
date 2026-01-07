/**
 * WordPress dependencies
 */
import type { BlockInstance, BlockEditProps } from '@wordpress/blocks';

export type ImageBlock = BlockInstance< {
	id: number;
	url: string;
	// New local attribute in WordPress 6.7.
	blob: string;
	caption: string;
	alt: string;
} > & { name: 'core/image' };

export type AudioBlock = BlockInstance< {
	id: number;
	src: string;
	// New local attribute in WordPress 6.7.
	blob: string;
} > & { name: 'core/audio' };

export type VideoBlock = BlockInstance< {
	id: number;
	src: string;
	// New local attribute in WordPress 6.7.
	blob: string;
	poster: string;
	muted: boolean;
	caption: string;
	tracks: Array< {
		src?: string;
		label?: string;
		srcLang?: string;
		kind: 'subtitles' | 'captions';
	} >;
	controls: boolean;
	loop: boolean;
	autoplay: boolean;
	playsInline: boolean;
} > & { name: 'core/video' };

export type MediaTextBlock = BlockInstance< {
	mediaId: number;
	mediaUrl: string;
	mediaType: string;
} > & { name: 'core/media-text' };

export type GalleryBlock = BlockInstance< {
	images: Array< {
		id: number;
		url: string;
		alt: string;
		caption: string;
	} >;
} > & { name: 'core/gallery' };

export type CoverBlock = BlockInstance< {
	id: number;
	url: string;
	useFeaturedImage: boolean;
	backgroundType: string;
} > & { name: 'core/cover' };

export type PostFeaturedImageBlock = BlockInstance< {} > & {
	name: 'core/post-featured-image';
};

export type SiteLogoBlock = BlockInstance< {
	shouldSyncIcon: boolean;
} > & {
	name: 'core/site-logo';
};

export type EmbedBlock = BlockInstance< {
	url: string;
	providerNameSlug: string;
} > & {
	name: 'core/embed';
};

export type MediaPanelProps =
	| ( ImageBlock &
			Pick<
				BlockEditProps< ImageBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( VideoBlock &
			Pick<
				BlockEditProps< VideoBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( AudioBlock &
			Pick<
				BlockEditProps< AudioBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( GalleryBlock &
			Pick<
				BlockEditProps< GalleryBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( MediaTextBlock &
			Pick<
				BlockEditProps< MediaTextBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( CoverBlock &
			Pick<
				BlockEditProps< CoverBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( PostFeaturedImageBlock &
			Pick<
				BlockEditProps< PostFeaturedImageBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( SiteLogoBlock &
			Pick<
				BlockEditProps< SiteLogoBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> )
	| ( EmbedBlock &
			Pick<
				BlockEditProps< EmbedBlock[ 'attributes' ] >,
				'setAttributes' | 'className'
			> );
