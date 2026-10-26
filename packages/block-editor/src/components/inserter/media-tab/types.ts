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

export interface MediaCategoryPanelProps {
	onInsert: ( block: import( '@wordpress/blocks' ).Block ) => void;
	category: MediaCategory;
	search: string;
	onChangeSearch: ( search: string ) => void;
	/** Fewer than two renders no tab bar. */
	mediaTypes?: { value: MediaType; label: string }[];
	mediaType: MediaType;
	onChangeMediaType?: ( mediaType: MediaType ) => void;
	/** Rendered beside the search input. */
	sourceMenu?: import( 'react' ).ReactNode;
	/** Rendered beneath the pager. */
	footer?: import( 'react' ).ReactNode;
}
