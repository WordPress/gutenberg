import { Button, SearchControl } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __, _x } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';

type NoteStatusFilter = 'all' | 'hold' | 'approved';

type NotesFilterValues = {
	search: string;
	status: NoteStatusFilter;
};

type Note = {
	id: number;
	author_name: string;
	status: string;
	content: { rendered: string };
	reply?: Note[];
};

export const DEFAULT_NOTES_FILTERS: NotesFilterValues = {
	search: '',
	status: 'all',
};

export function hasActiveNotesFilters( filters: NotesFilterValues ) {
	return filters.search.trim() !== '' || filters.status !== 'all';
}

// Keep the selected thread, so a note opened from the canvas still shows.
export function filterNotes< T extends Note >(
	threads: T[],
	filters: NotesFilterValues,
	selectedNoteId?: number | string
): T[] {
	if ( ! hasActiveNotesFilters( filters ) ) {
		return threads;
	}
	const search = filters.search.trim().toLowerCase();
	return threads.filter( ( thread ) => {
		if ( thread.id === selectedNoteId ) {
			return true;
		}
		const threadNotes = [ thread, ...( thread.reply ?? [] ) ];
		return (
			( filters.status === 'all' || thread.status === filters.status ) &&
			( ! search ||
				threadNotes.some(
					( note ) =>
						note.author_name.toLowerCase().includes( search ) ||
						stripHTML( note.content.rendered )
							.toLowerCase()
							.includes( search )
				) )
		);
	} );
}

type NotesFiltersProps = {
	filters: NotesFilterValues;
	onChange: ( filters: NotesFilterValues ) => void;
};

export function NotesFilters( { filters, onChange }: NotesFiltersProps ) {
	return (
		<Stack
			className="editor-collab-sidebar-filters"
			direction="row"
			gap="sm"
			align="center"
		>
			<SearchControl
				className="editor-collab-sidebar-filters__search"
				label={ __( 'Search notes' ) }
				value={ filters.search }
				onChange={ ( search ) => onChange( { ...filters, search } ) }
			/>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							__next40pxDefaultSize
							icon={ settings }
							label={ _x( 'Filter', 'verb' ) }
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<Menu.RadioGroup
						value={ filters.status }
						onValueChange={ ( status: NoteStatusFilter ) =>
							onChange( { ...filters, status } )
						}
					>
						<Menu.GroupLabel>{ __( 'Status' ) }</Menu.GroupLabel>
						<Menu.RadioItem value="all">
							<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem value="hold">
							<Menu.ItemLabel>{ __( 'Open' ) }</Menu.ItemLabel>
						</Menu.RadioItem>
						<Menu.RadioItem value="approved">
							<Menu.ItemLabel>
								{ __( 'Resolved' ) }
							</Menu.ItemLabel>
						</Menu.RadioItem>
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
