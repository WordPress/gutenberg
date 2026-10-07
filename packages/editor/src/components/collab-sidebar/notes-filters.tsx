import {
	Button,
	SearchControl,
	SelectControl as WCSelectControl,
} from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { useState } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import { funnel } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';

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
 * Counts the filters set in the collapsible panel. Search is left out since
 * its field is always shown.
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
	// Start open when filters are already set, e.g. after reopening the sidebar.
	const [ isPanelOpen, setIsPanelOpen ] = useState( panelFilterCount > 0 );

	return (
		<Stack
			className="editor-collab-sidebar-filters"
			direction="column"
			gap="sm"
		>
			<Stack direction="row" gap="sm" align="center">
				<SearchControl
					className="editor-collab-sidebar-filters__search"
					label={ __( 'Search notes' ) }
					value={ filters.search }
					onChange={ ( search ) =>
						onChange( { ...filters, search } )
					}
				/>
				<div className="editor-collab-sidebar-filters__toggle">
					<Button
						__next40pxDefaultSize
						icon={ funnel }
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
						aria-expanded={ isPanelOpen }
						isPressed={ isPanelOpen }
						onClick={ () => setIsPanelOpen( ! isPanelOpen ) }
					/>
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
			{ isPanelOpen && (
				<Stack direction="row" gap="sm" align="flex-start">
					<WCSelectControl
						label={ __( 'Status' ) }
						value={ filters.status }
						options={ [
							{ label: __( 'All' ), value: 'all' },
							{ label: __( 'Open' ), value: 'hold' },
							{ label: __( 'Resolved' ), value: 'approved' },
						] }
						onChange={ ( status ) =>
							onChange( { ...filters, status } )
						}
					/>
					{ ( authors.size > 1 || filters.author !== 'all' ) && (
						<WCSelectControl
							label={ __( 'Author' ) }
							value={ filters.author }
							options={ [
								{ label: __( 'All' ), value: 'all' },
								...Array.from(
									authors,
									( [ value, label ] ) => ( {
										label,
										value,
									} )
								),
							] }
							onChange={ ( author ) =>
								onChange( { ...filters, author } )
							}
						/>
					) }
				</Stack>
			) }
		</Stack>
	);
}
