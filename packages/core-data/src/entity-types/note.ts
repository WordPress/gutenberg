import type {
	AvatarUrls,
	Context,
	ContextualField,
	OmitNevers,
	RenderedText,
} from './helpers';
import type { BaseEntityRecords as _BaseEntityRecords } from './base-entity-records';

export type NoteStatus = 'hold' | 'approved';

declare module './base-entity-records' {
	export namespace BaseEntityRecords {
		export interface Note< C extends Context > {
			/**
			 * Unique identifier for the note.
			 */
			id: number;
			/**
			 * The ID of the user object, if author was a user.
			 */
			author: number;
			/**
			 * Display name for the note author.
			 */
			author_name: string;
			/**
			 * Avatar URLs for the note author.
			 */
			author_avatar_urls: AvatarUrls;
			/**
			 * The content for the note.
			 */
			content: RenderedText< C >;
			/**
			 * The date the note was published, in the site's timezone.
			 */
			date: string;
			/**
			 * The date the note was published, as GMT.
			 */
			date_gmt: ContextualField< string, 'view' | 'edit', C >;
			/**
			 * The ID of the note this one replies to, or 0 for a thread.
			 */
			parent: number;
			/**
			 * The ID of the associated post object.
			 */
			post: ContextualField< number, 'view' | 'edit', C >;
			/**
			 * Whether the note is open (`hold`) or resolved (`approved`).
			 */
			status: ContextualField< NoteStatus, 'view' | 'edit', C >;
			/**
			 * Type of the note. Always `note`.
			 */
			type: string;
			/**
			 * The replies in the thread, oldest first. Only threads carry them.
			 */
			replies: Note< C >[];
			/**
			 * The number of replies in the thread.
			 */
			reply_count: number;
			/**
			 * Meta fields.
			 */
			meta: ContextualField<
				Record< string, unknown >,
				'view' | 'edit',
				C
			>;
		}
	}
}

export type Note< C extends Context = 'edit' > = OmitNevers<
	_BaseEntityRecords.Note< C >
>;
