import { Stack } from '@wordpress/ui';
import { NoteByline } from './note-byline';

export function NoteCard( { note, actions, className, children, ...props } ) {
	return (
		<Stack direction="column" gap="sm" className={ className } { ...props }>
			<Stack direction="row" align="center" justify="flex-start" gap="md">
				<NoteByline
					avatar={ note?.author_avatar_urls?.[ 48 ] }
					name={ note?.author_name }
					date={ note?.date }
					userId={ note?.author }
				/>
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
