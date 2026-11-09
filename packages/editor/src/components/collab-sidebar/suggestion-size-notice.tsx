import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Whether the last save had to leave a note's proposals in the post content,
 * because they were over the size the note can store. The server sets the
 * flag; it is read-only over REST.
 *
 * @param thread The note thread.
 * @return Whether the proposals stayed in the post content.
 */
export function isExtractionSkipped( thread: any ): boolean {
	return thread?.meta?._wp_suggestion_extraction_skipped === true;
}

/**
 * Tells a reviewer that a suggestion was too large to move out of the saved
 * post. The render filters still hide it from visitors.
 *
 * @param props        Props.
 * @param props.thread The note thread.
 */
export default function SuggestionSizeNotice( { thread }: { thread: any } ) {
	if ( ! isExtractionSkipped( thread ) ) {
		return null;
	}
	return (
		<Notice.Root
			intent="warning"
			className="editor-collab-sidebar-panel__suggestion-size-notice"
		>
			<Notice.Description>
				{ __(
					'This suggestion is too large to keep out of the saved post. It stays hidden from visitors until someone accepts or rejects it.'
				) }
			</Notice.Description>
		</Notice.Root>
	);
}
