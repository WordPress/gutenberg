import clsx from 'clsx';
import { Button, SearchControl } from '@wordpress/components';
import { __unstableStripHTML as stripHTML } from '@wordpress/dom';
import { __, _x, sprintf } from '@wordpress/i18n';
import { settings } from '@wordpress/icons';
import {
	// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
	Menu,
	Stack,
} from '@wordpress/ui';
import { isSuggestionModeEnabled } from '../suggestion-mode/gate';
import {
	APPLIED,
	REJECTED,
	getDecision,
	getSuggestionStatus,
} from '../suggestion-mode/suggestion-status';

const NOTE_STATUS_FILTERS = [ 'all', 'hold', 'approved' ] as const;
const SUGGESTION_STATUS_FILTERS = [ 'accepted', 'rejected' ] as const;

type NoteStatusFilter =
	| ( typeof NOTE_STATUS_FILTERS )[ number ]
	| ( typeof SUGGESTION_STATUS_FILTERS )[ number ];

type NotesFilterValues = {
	search: string;
	status: NoteStatusFilter;
};

type Note = {
	id: number;
	author_name: string;
	status: string;
	meta?: { _wp_suggestion?: string; _wp_suggestion_status?: string };
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

function matchesStatus( thread: Note, status: NoteStatusFilter ) {
	if ( status === 'all' ) {
		return true;
	}
	if ( status === 'accepted' || status === 'rejected' ) {
		// A decision counts before the post is saved, as the card shows it.
		return (
			!! thread.meta?._wp_suggestion &&
			getDecision( getSuggestionStatus( thread ) ) ===
				( status === 'accepted' ? APPLIED : REJECTED )
		);
	}
	return thread.status === status;
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
			matchesStatus( thread, filters.status ) &&
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
	const statusLabels: Record< NoteStatusFilter, string > = {
		all: __( 'All' ),
		hold: __( 'Open' ),
		approved: __( 'Resolved' ),
		accepted: __( 'Accepted suggestions' ),
		rejected: __( 'Rejected suggestions' ),
	};
	const statuses = isSuggestionModeEnabled()
		? [ ...NOTE_STATUS_FILTERS, ...SUGGESTION_STATUS_FILTERS ]
		: NOTE_STATUS_FILTERS;
	const isStatusFiltered = filters.status !== 'all';

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
							className={ clsx(
								'editor-collab-sidebar-filters__toggle',
								{ 'is-active': isStatusFiltered }
							) }
							icon={ settings }
							label={
								isStatusFiltered
									? sprintf(
											/* translators: %s: Note status shown, e.g. "Open". */
											__( 'Filter: %s' ),
											statusLabels[ filters.status ]
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
						<Menu.GroupLabel>{ __( 'Status' ) }</Menu.GroupLabel>
						{ statuses.map( ( status ) => (
							<Menu.RadioItem key={ status } value={ status }>
								<Menu.ItemLabel>
									{ statusLabels[ status ] }
								</Menu.ItemLabel>
							</Menu.RadioItem>
						) ) }
					</Menu.RadioGroup>
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
