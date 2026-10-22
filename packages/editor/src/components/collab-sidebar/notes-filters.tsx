import { Button, SearchControl } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Menu, Stack } from '@wordpress/ui';

type NoteStatusFilter = 'all' | 'hold' | 'approved';

export type NotesFilterValues = {
	search: string;
	status: NoteStatusFilter;
	author: string;
};

type Note = {
	id: number;
	author: number;
	author_name: string;
	status: string;
	content: { rendered: string };
	reply?: Note[];
};

export const DEFAULT_NOTES_FILTERS: NotesFilterValues = {
	search: '',
	status: 'all',
	author: 'all',
};

/**
 * Whether any filter narrows the list.
 *
 * @param filters Filter values.
 */
export function hasActiveNotesFilters( filters: NotesFilterValues ) {
	return (
		filters.search.trim() !== '' ||
		filters.status !== 'all' ||
		filters.author !== 'all'
	);
}

/**
 * Whether a filter can match a reply, so collapsed replies should be shown.
 *
 * @param filters Filter values.
 */
export function shouldExpandReplies( filters: NotesFilterValues ) {
	return filters.search.trim() !== '' || filters.author !== 'all';
}

/**
 * Counts the filters set in the filter menu. Search is left out since its
 * field is always shown.
 *
 * @param filters Filter values.
 */
export function countPanelFilters( filters: NotesFilterValues ) {
	return (
		Number( filters.status !== 'all' ) + Number( filters.author !== 'all' )
	);
}

/**
 * Maps each note author's ID to their display name.
 *
 * @param threads Note threads.
 */
export function getNoteAuthors( threads: Note[] ) {
	const authors = new Map< string, string >();
	for ( const thread of threads ) {
		for ( const note of [ thread, ...( thread.reply ?? [] ) ] ) {
			authors.set( String( note.author ), note.author_name );
		}
	}
	return authors;
}

/**
 * Drops an author filter whose author no longer has notes, for example after
 * their last thread is deleted, so the list can't get stuck empty.
 *
 * @param threads Note threads.
 * @param filters Filter values.
 */
export function sanitizeNotesFilters(
	threads: Note[],
	filters: NotesFilterValues
): NotesFilterValues {
	if (
		filters.author === 'all' ||
		getNoteAuthors( threads ).has( filters.author )
	) {
		return filters;
	}
	return { ...filters, author: 'all' };
}

/**
 * Returns the threads that match the filters. A thread matches the search
 * and author filters when its first note or any reply does.
 *
 * @param threads        Note threads.
 * @param filters        Filter values.
 * @param selectedNoteId Selected thread, kept visible so it doesn't vanish.
 */
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
			( filters.author === 'all' ||
				threadNotes.some(
					( note ) => String( note.author ) === filters.author
				) ) &&
			( ! search ||
				threadNotes.some( ( note ) =>
					stripHTML( note.content.rendered )
						.toLowerCase()
						.includes( search )
				) )
		);
	} );
}

type NotesFiltersProps = {
	notes: Note[];
	filters: NotesFilterValues;
	onChange: ( filters: NotesFilterValues ) => void;
};

/**
 * Search and filter controls for the "All notes" sidebar.
 *
 * @param props          Component props.
 * @param props.notes    Note threads, used to list the authors.
 * @param props.filters  Filter values.
 * @param props.onChange Called with the new filter values.
 */
export function NotesFilters( {
	notes,
	filters,
	onChange,
}: NotesFiltersProps ) {
	const authors = getNoteAuthors( notes );
	const panelFilterCount = countPanelFilters( filters );

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
			<div className="editor-collab-sidebar-filters__toggle">
				<Menu.Root>
					<Menu.Trigger
						render={
							<Button
								__next40pxDefaultSize
								icon={ settings }
								label={
									panelFilterCount
										? sprintf(
												/* translators: %d: Number of filters applied. */
												_n(
													'Filter (%d applied)',
													'Filter (%d applied)',
													panelFilterCount
												),
												panelFilterCount
											)
										: _x( 'Filter', 'verb' )
								}
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
							<Menu.GroupLabel>
								{ __( 'Status' ) }
							</Menu.GroupLabel>
							<Menu.RadioItem value="all">
								<Menu.ItemLabel>{ __( 'All' ) }</Menu.ItemLabel>
							</Menu.RadioItem>
							<Menu.RadioItem value="hold">
								<Menu.ItemLabel>
									{ __( 'Open' ) }
								</Menu.ItemLabel>
							</Menu.RadioItem>
							<Menu.RadioItem value="approved">
								<Menu.ItemLabel>
									{ __( 'Resolved' ) }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						</Menu.RadioGroup>
						{ ( authors.size > 1 || filters.author !== 'all' ) && (
							<>
								<Menu.Separator />
								<Menu.RadioGroup
									value={ filters.author }
									onValueChange={ ( author: string ) =>
										onChange( { ...filters, author } )
									}
								>
									<Menu.GroupLabel>
										{ __( 'Author' ) }
									</Menu.GroupLabel>
									<Menu.RadioItem value="all">
										<Menu.ItemLabel>
											{ __( 'All' ) }
										</Menu.ItemLabel>
									</Menu.RadioItem>
									{ Array.from( authors, ( [ id, name ] ) => (
										<Menu.RadioItem key={ id } value={ id }>
											<Menu.ItemLabel>
												{ name }
											</Menu.ItemLabel>
										</Menu.RadioItem>
									) ) }
								</Menu.RadioGroup>
							</>
						) }
					</Menu.Popup>
				</Menu.Root>
				{ panelFilterCount > 0 && (
					<span
						className="editor-collab-sidebar-filters__count"
						aria-hidden="true"
					>
						{ panelFilterCount }
					</span>
				) }
			</div>
		</Stack>
	);
}
