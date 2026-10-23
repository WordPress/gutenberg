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

/**
 * Whether any filter narrows the list.
 *
 * @param filters Filter values.
 */
export function hasActiveNotesFilters( filters: NotesFilterValues ) {
	return filters.search.trim() !== '' || filters.status !== 'all';
}

/**
 * Whether a filter can match a reply, so collapsed replies should be shown.
 *
 * @param filters Filter values.
 */
export function shouldExpandReplies( filters: NotesFilterValues ) {
	return filters.search.trim() !== '';
}

/**
 * Returns the threads that match the filters. A thread matches the search
 * when the text or author name of its first note or any reply does.
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

/**
 * Search and filter controls for the "All notes" sidebar.
 *
 * @param props          Component props.
 * @param props.filters  Filter values.
 * @param props.onChange Called with the new filter values.
 */
export function NotesFilters( { filters, onChange }: NotesFiltersProps ) {
	// Search is left out of the count since its field is always shown.
	const menuFilterCount = Number( filters.status !== 'all' );

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
									menuFilterCount
										? sprintf(
												/* translators: %d: Number of filters applied. */
												_n(
													'Filter (%d applied)',
													'Filter (%d applied)',
													menuFilterCount
												),
												menuFilterCount
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
					</Menu.Popup>
				</Menu.Root>
				{ menuFilterCount > 0 && (
					<span
						className="editor-collab-sidebar-filters__count"
						aria-hidden="true"
					>
						{ menuFilterCount }
					</span>
				) }
			</div>
		</Stack>
	);
}
