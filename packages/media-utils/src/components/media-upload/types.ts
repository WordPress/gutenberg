import type { ReactNode } from 'react';
import type { Attachment } from '../../utils/types';

/**
 * Fields returned by the legacy media library, rather than the REST API.
 */
export type MediaAttachment = Partial<
	Pick< Attachment, 'id' | 'url' | 'alt' | 'link' | 'caption' >
> & {
	mime?: string;
	type?: string;
	subtype?: string;
	sizes?: Record< string, unknown >;
	[ key: string ]: unknown;
};

/**
 * Props for the legacy WordPress media library implementation of MediaUpload.
 */
export interface MediaUploadProps {
	/** Types of media available for upload or selection. */
	allowedTypes?: string[];
	/** Default frame content mode, such as `browse` or `upload`. */
	mode?: string;
	/** Whether to allow multiple selection; `add` avoids modifier keys. */
	multiple?: boolean | string;
	/** Media ID or IDs selected when opening the library. */
	value?: number | number[];
	/** Called when the modal closes, with or without a selection. */
	onClose?: () => void;
	/** Called with the selected media after closing the modal. */
	onSelect: ( media: MediaAttachment | MediaAttachment[] ) => void;
	/** Title of the media modal. */
	title?: string;
	/** CSS class added to the media modal frame. */
	modalClass?: string;
	/** Whether a gallery opens in the library instead of the edit frame. */
	addToGallery?: boolean;
	/** Whether to initiate the gallery states. */
	gallery?: boolean;
	/** Whether to open the featured image frame. */
	featuredImageFlow?: boolean;
	/** @deprecated Use `featuredImageFlow` instead. */
	unstableFeaturedImageFlow?: boolean;
	/** Renders the control that opens the media library. */
	render: ( props: { open: () => void } ) => ReactNode;
}

/**
 * The portion of the Backbone media models used by this component.
 */
export interface MediaModel {
	toJSON: () => MediaAttachment;
	trigger: ( event: string, ...args: unknown[] ) => void;
}

export interface MediaCollection {
	models: MediaModel[];
	props: { toJSON: () => Record< string, unknown > };
	mirroring: { _hasMore: boolean };
	add: ( models: MediaModel | MediaModel[] ) => void;
	single: () => MediaModel;
	toJSON: () => MediaAttachment[];
	toArray: () => MediaModel[];
	more: () => { done: ( callback: () => void ) => void };
}

interface MediaStateAttributes {
	selection: MediaCollection;
	library: MediaCollection;
	editing: boolean;
}

interface MediaState {
	get: < Key extends keyof MediaStateAttributes >(
		key: Key
	) => MediaStateAttributes[ Key ];
	trigger: ( event: string, ...args: unknown[] ) => void;
}

export interface MediaFrameOptions {
	title?: string;
	state?: string;
	multiple?: boolean | string;
	library?: { type?: string | string[] };
	selection?: MediaCollection;
	editing?: boolean | number | number[];
	editImage?: MediaModel;
	states?: MediaState[];
	mimeType?: string[];
}

interface MediaView {
	render: () => MediaView;
	loadEditor: () => void;
}

/**
 * The frame is created before its lifecycle callbacks run.
 */
export interface MediaFrame {
	options: MediaFrameOptions;
	el?: HTMLElement;
	modal?: { el?: HTMLElement; remove: () => void };
	$el: { addClass: ( className: string ) => void };
	content: {
		set: ( view: MediaView ) => void;
		mode: ( mode: string ) => void;
		get: () => { collection?: MediaCollection } | undefined;
	};
	toolbar: { set: ( toolbar: MediaView ) => void };
	states: { add: ( states: MediaState[] ) => void };
	state: ( id?: string ) => MediaState;
	setState: ( id?: string ) => void;
	reset: () => void;
	createSelectToolbar: (
		toolbar: object,
		options: { text: string; state?: string }
	) => void;
	on: (
		event: string,
		callback: ( ...args: never[] ) => unknown,
		context?: unknown
	) => void;
	close: () => void;
	open: () => void;
	remove: () => void;
	detach: () => void;
}

export interface MediaFrameConstructor {
	new ( options: MediaFrameOptions ): MediaFrame;
	extend: < Methods extends object >(
		methods: Methods & ThisType< MediaFrame & Methods >
	) => MediaFrameConstructor;
}

interface ToolbarOptions {
	controller: MediaFrame;
	items: Record<
		string,
		{
			style: string;
			text: string;
			priority: number;
			requires: { library: boolean };
			click: ( this: { controller: MediaFrame } ) => void;
		}
	>;
}

/**
 * The legacy wp.media API supplied by WordPress, limited to the surface used here.
 */
export interface MediaWindow {
	wp: {
		media: {
			frame: MediaFrame;
			query: ( options?: Record< string, unknown > ) => MediaCollection;
			attachment: ( id: number | undefined ) => MediaModel;
			model: {
				Selection: new (
					models: MediaModel[],
					options: {
						props: Record< string, unknown >;
						multiple?: boolean | string;
					}
				) => MediaCollection;
			};
			controller: Record<
				| 'FeaturedImage'
				| 'EditImage'
				| 'Library'
				| 'GalleryEdit'
				| 'GalleryAdd',
				new ( options?: Record< string, unknown > ) => MediaState
			>;
			view: {
				MediaFrame: {
					Select: MediaFrameConstructor;
					Post: MediaFrameConstructor;
				};
				EditImage: new ( options: {
					model: MediaModel;
					controller: MediaFrame;
				} ) => MediaView;
				Toolbar: new ( options: ToolbarOptions ) => MediaView;
				l10n: Record<
					| 'setFeaturedImage'
					| 'updateGallery'
					| 'insertGallery'
					| 'createGalleryTitle',
					string
				>;
				settings: {
					post: Record< string, unknown > & {
						featuredImageId?: number | number[];
					};
				};
			};
		};
	};
}
