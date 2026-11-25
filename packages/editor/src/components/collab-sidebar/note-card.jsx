import clsx from 'clsx';
import { Stack } from '@wordpress/ui';
import { NoteByline } from './note-byline';

/**
 * A note's byline, actions and content.
 *
 * @param {Object}  props
 * @param {Object}  [props.note]        Note the byline describes.
 * @param {Element} [props.actions]     Controls shown beside the byline.
 * @param {Object}  [props.toggleProps] Makes the byline a button, for the thread's disclosure toggle.
 * @param {Element} [props.afterToggle] Rendered right after the toggle.
 * @param {string}  [props.className]   Additional class name.
 * @param {Element} [props.children]    Note content.
 */
export function NoteCard( {
	note,
	actions,
	toggleProps,
	afterToggle,
	className,
	children,
	...props
} ) {
	const byline = (
		<NoteByline
			avatar={ note?.author_avatar_urls?.[ 48 ] }
			name={ note?.author_name }
			date={ note?.date }
			userId={ note?.author }
		/>
	);
	return (
		<Stack
			direction="column"
			gap="sm"
			className={ clsx( 'editor-collab-sidebar-panel__note', className ) }
			{ ...props }
		>
			<Stack direction="row" align="center" justify="flex-start" gap="md">
				{ toggleProps ? (
					<button
						type="button"
						className="editor-collab-sidebar-panel__thread-toggle"
						{ ...toggleProps }
					>
						{ byline }
					</button>
				) : (
					byline
				) }
				{ afterToggle }
				{ actions && (
					<Stack
						direction="row"
						align="center"
						className="editor-collab-sidebar-panel__note-actions"
						onClick={ ( event ) => event.stopPropagation() }
					>
						{ actions }
					</Stack>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}
