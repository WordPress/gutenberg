/**
 * External dependencies
 */
import type { ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import { FlexItem } from '@wordpress/components';
import { Stack } from '@wordpress/ui';

/**
 * Internal dependencies
 */
import { NoteByline } from './note-byline';
import type { Thread } from './utils';

type NoteCardProps = {
	note?: Thread;
	actions?: ReactNode;
	className?: string;
	children?: ReactNode;
} & Record< string, any >;

export function NoteCard( {
	note,
	actions,
	className,
	children,
	...props
}: NoteCardProps ) {
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
					<FlexItem
						className="editor-collab-sidebar-panel__note-actions"
						onClick={ ( event ) => event.stopPropagation() }
					>
						<Stack direction="row" align="center">
							{ actions }
						</Stack>
					</FlexItem>
				) }
			</Stack>
			{ children }
		</Stack>
	);
}
