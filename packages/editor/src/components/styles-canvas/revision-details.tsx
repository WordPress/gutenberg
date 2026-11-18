import { dateI18n, getDate, getSettings } from '@wordpress/date';
import { __ } from '@wordpress/i18n';

/**
 * The parts of a global styles revision the details show. The revisions hook
 * adds the author, including the current user for unsaved changes.
 */
export interface RevisionDetailsRevision {
	id: string | number;
	modified?: string | Date;
	author?: {
		name?: string;
		avatar_urls?: Record< string, string >;
	};
}

interface RevisionDetailsProps {
	/**
	 * The revision to describe.
	 */
	revision: RevisionDetailsRevision;
	/**
	 * Whether the revision holds the styles the editor shows.
	 */
	isCurrent?: boolean;
}

/**
 * Returns the label for when a revision was made: its date, or what the entry
 * stands for when it isn't a saved revision.
 *
 * @param revision The revision.
 * @return The label.
 */
function getRevisionDateLabel( revision: RevisionDetailsRevision ): string {
	if ( 'parent' === revision.id ) {
		return __( 'Default styles' );
	}
	if ( 'unsaved' === revision.id ) {
		return __( 'Unsaved changes' );
	}
	if ( ! revision.modified ) {
		return '';
	}
	const modified =
		revision.modified instanceof Date
			? revision.modified.toISOString()
			: revision.modified;
	return dateI18n( getSettings().formats.datetime, getDate( modified ) );
}

/**
 * Describes a global styles revision: when it was made and by whom.
 *
 * @param props           Component props.
 * @param props.revision  The revision to describe.
 * @param props.isCurrent Whether the revision holds the styles the editor shows.
 * @return The revision details.
 */
export default function RevisionDetails( {
	revision,
	isCurrent = false,
}: RevisionDetailsProps ) {
	// The theme defaults have no author. Any other entry names one, falling
	// back as the revisions list does when the author isn't known.
	const hasAuthor = 'parent' !== revision.id;
	const avatarUrl = revision.author?.avatar_urls?.[ '48' ];
	const dateLabel = getRevisionDateLabel( revision );

	return (
		<p className="editor-styles-canvas-revision-details">
			{ isCurrent && (
				<span className="editor-styles-canvas-revision-details__current">
					{ __( 'Current version' ) }
				</span>
			) }
			{ dateLabel && <span>{ dateLabel }</span> }
			{ hasAuthor && (
				<span className="editor-styles-canvas-revision-details__author">
					{ avatarUrl && (
						// The name follows, so the avatar is decorative.
						<img alt="" src={ avatarUrl } />
					) }
					{ revision.author?.name || __( 'User' ) }
				</span>
			) }
		</p>
	);
}
