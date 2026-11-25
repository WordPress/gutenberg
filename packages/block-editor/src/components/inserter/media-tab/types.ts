type InserterMediaCategory =
	import( '../../../store/types' ).InserterMediaCategory;

/**
 * Taken from the registration interface so the two cannot drift.
 */
export type MediaType = InserterMediaCategory[ 'mediaType' ];

/**
 * A registered media category, plus the display label the tab derives from
 * `labels.name` so the UI has one field to read.
 *
 * Core's own categories carry further capabilities — `attach`, `detach`,
 * `subscribe` — which are private and typed where they are consumed, in
 * `use-attachment-actions`.
 */
export type MediaCategory = InserterMediaCategory & { label: string };

/**
 * An `InserterMediaItem` (see the `registerInserterMediaCategory` typedef in
 * the store actions). Core sources spread the attachment record in, so `date`
 * is present for them and absent for external sources, and `title` arrives as
 * the REST `{ rendered }` object rather than the plain string the interface
 * promises.
 */
export type MediaItem = {
	id?: number;
	sourceId?: number | string;
	title?: string | { rendered?: string };
	url: string;
	previewUrl?: string;
	alt?: string;
	caption?: string;
	date?: string;
};

/**
 * Where the tab's media comes from: the media library, the post's attached
 * images, or any other registered category such as Openverse.
 */
export type MediaSource = {
	name: string;
	label: string;
};

export interface MediaCategoryPanelProps {
	onInsert: ( block: import( '@wordpress/blocks' ).Block ) => void;
	category: MediaCategory;
	search: string;
	onChangeSearch: ( search: string ) => void;
	/** Fewer than two renders no tab bar. */
	mediaTypes?: { value: MediaType; label: string }[];
	mediaType: MediaType;
	onChangeMediaType?: ( mediaType: MediaType ) => void;
	/** Fewer than two offers no choice of source. */
	sources?: MediaSource[];
	/** The name of the source being browsed. */
	source?: string;
	onChangeSource?: ( source: string ) => void;
	/**
	 * Goes back to the default source and media type. `false` when they are
	 * the ones showing already; leave it out to offer no reset.
	 */
	onReset?: ( () => void ) | false;
	/** Rendered beneath the pager. */
	footer?: import( 'react' ).ReactNode;
}
