import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useRef, useState } from '@wordpress/element';
/*
 * `Button` and `IconButton` are pending Design System review
 * (WordPress/gutenberg#76135).
 */
// eslint-disable-next-line @wordpress/use-recommended-components -- Intentional early adoption of the new Menu, pending WordPress/gutenberg#76135.
import { Button, IconButton, Menu, Stack, Tooltip } from '@wordpress/ui';
import { ThemeProvider } from '@wordpress/theme';
import { reaction as reactionIcon } from '@wordpress/icons';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { REACTION_EMOJIS, getReactionEmoji } from './reaction-emojis';
import { useNoteReactions } from './use-note-reactions';
import type { ReactionSummary } from './use-note-reactions';

type ReactorNames = Record< string, string[] >;

interface ReactionComment {
	author_name: string;
	content: string | { raw?: string; rendered?: string };
}

const REACTIONS_PER_PAGE = 100;

// A note with more reactions than this is not worth walking page by page just
// to name them; the pill falls back to its count-based label instead.
const MAX_REACTION_PAGES = 10;

/**
 * Fetches the names of everyone who reacted to a note, grouped by hex key.
 *
 * The REST collection cannot be filtered by hex key, so every reaction on the
 * note comes back and is grouped here.
 *
 * @param noteId The parent note comment ID.
 * @return Reactor names keyed by hex key, or `null` when the note has more
 *         reactions than the walk will fetch.
 */
async function fetchReactorNames(
	noteId: number
): Promise< ReactorNames | null > {
	const names: ReactorNames = {};

	for ( let page = 1; page <= MAX_REACTION_PAGES; page++ ) {
		let batch: ReactionComment[];
		try {
			batch = await apiFetch< ReactionComment[] >( {
				path: addQueryArgs( '/wp/v2/comments', {
					parent: noteId,
					type: 'reaction',
					status: 'all',
					page,
					per_page: REACTIONS_PER_PAGE,
					_fields: 'author_name,content',
				} ),
			} );
		} catch ( error ) {
			// A full last page sends the walk one page past the end, which the
			// endpoint rejects.
			if (
				page > 1 &&
				( error as { code?: string } )?.code ===
					'rest_comment_invalid_page_number'
			) {
				return names;
			}
			throw error;
		}

		for ( const { author_name: authorName, content } of batch ) {
			const raw =
				typeof content === 'object'
					? content?.raw || content?.rendered
					: content;
			const hexKey = raw?.replace( /<[^>]*>/g, '' ).trim();
			if ( hexKey ) {
				names[ hexKey ] = [ ...( names[ hexKey ] ?? [] ), authorName ];
			}
		}

		if ( batch.length < REACTIONS_PER_PAGE ) {
			return names;
		}
	}

	return null;
}

/**
 * GitHub-style reactor list, e.g. "Ada, Grace, and 3 others reacted with heart".
 *
 * @param names      Reactor display names.
 * @param emojiLabel The emoji label.
 * @return The label.
 */
function formatReactorNames( names: string[], emojiLabel: string ): string {
	if ( names.length === 1 ) {
		return sprintf(
			/* translators: 1: user name, 2: emoji label. */
			__( '%1$s reacted with %2$s' ),
			names[ 0 ],
			emojiLabel
		);
	}

	if ( names.length === 2 ) {
		return sprintf(
			/* translators: 1: first user name, 2: second user name, 3: emoji label. */
			__( '%1$s and %2$s reacted with %3$s' ),
			names[ 0 ],
			names[ 1 ],
			emojiLabel
		);
	}

	const othersCount = names.length - 2;
	return sprintf(
		/* translators: 1: first user name, 2: second user name, 3: number of other users, 4: emoji label. */
		_n(
			'%1$s, %2$s, and %3$d other reacted with %4$s',
			'%1$s, %2$s, and %3$d others reacted with %4$s',
			othersCount
		),
		names[ 0 ],
		names[ 1 ],
		othersCount,
		emojiLabel
	);
}

interface ReactionButtonProps {
	hexKey: string;
	count: number;
	isActive: boolean;
	names?: string[];
	disabled: boolean;
	onToggle: ( hexKey: string ) => void;
	onShowNames: () => void;
}

function ReactionButton( {
	hexKey,
	count,
	isActive,
	names,
	disabled,
	onToggle,
	onShowNames,
}: ReactionButtonProps ) {
	const emoji = getReactionEmoji( hexKey );
	const emojiLabel = emoji?.label ?? hexKey;
	const label = names?.length
		? formatReactorNames( names, emojiLabel )
		: sprintf(
				/* translators: 1: emoji label, 2: count of reactions */
				_n( '%1$s, %2$s reaction', '%1$s, %2$s reactions', count ),
				emojiLabel,
				count.toLocaleString()
			);

	return (
		<Tooltip.Root>
			<Tooltip.Trigger
				render={
					<Button
						size="small"
						// The design has no solid fill, which the Design System
						// gives a pressed neutral minimal Button; `aria-pressed`
						// carries the state for assistive tech.
						variant={ isActive ? 'outline' : 'minimal' }
						tone={ isActive ? 'brand' : 'neutral' }
						className="editor-collab-sidebar-panel__reaction-button"
						disabled={ disabled }
						aria-pressed={ isActive }
						aria-label={ label }
						onClick={ ( event: MouseEvent< HTMLElement > ) => {
							event.stopPropagation();
							// Removing the last reaction unmounts this pill.
							if ( isActive && count === 1 ) {
								( event.target as HTMLElement )
									.closest< HTMLElement >(
										'.editor-collab-sidebar-panel__thread'
									)
									?.focus();
							}
							onToggle( hexKey );
						} }
						onMouseEnter={ onShowNames }
						onFocus={ onShowNames }
					/>
				}
			>
				<span className="editor-collab-sidebar-panel__reaction-button-emoji">
					{ emoji?.emoji ?? hexKey }
				</span>
				<span>{ count.toLocaleString() }</span>
			</Tooltip.Trigger>
			<Tooltip.Popup>{ label }</Tooltip.Popup>
		</Tooltip.Root>
	);
}

interface NoteReactionsProps {
	noteId: number;
	canReact: boolean;
	disabled: boolean;
}

/**
 * A note's reaction pills, followed by the add-reaction picker.
 *
 * @param props          Component props.
 * @param props.noteId   The note comment ID.
 * @param props.canReact Whether to offer the add-reaction picker.
 * @param props.disabled Whether reactions can no longer be toggled (the thread
 *                       is resolved).
 */
export function NoteReactions( {
	noteId,
	canReact,
	disabled,
}: NoteReactionsProps ) {
	const [ reactions, toggleReaction ] = useNoteReactions( noteId );
	const [ fetchedNames, setFetchedNames ] = useState< {
		summary: ReactionSummary;
		names: ReactorNames;
	} | null >( null );
	const requestedSummaryRef = useRef< ReactionSummary | undefined >(
		undefined
	);

	// Names fetched for an older summary may not match the current counts.
	const reactorNames =
		reactions && fetchedNames?.summary === reactions
			? fetchedNames.names
			: undefined;
	const entries = Object.entries( reactions ?? {} );

	if ( ! entries.length && ! canReact ) {
		return null;
	}

	function showNames() {
		const summary = reactions;
		if ( ! summary || requestedSummaryRef.current === summary ) {
			return;
		}
		requestedSummaryRef.current = summary;
		fetchReactorNames( noteId )
			.then( ( names ) => {
				// A partial list reads as complete; keep the count-based label.
				if ( names ) {
					setFetchedNames( { summary, names } );
				}
			} )
			.catch( () => {
				if ( requestedSummaryRef.current === summary ) {
					requestedSummaryRef.current = undefined;
				}
			} );
	}

	return (
		// The editor sets `cornerRadius="none"`; reactions read as badges, so
		// they take the pill shape.
		<ThemeProvider cornerRadius="pronounced">
			<Stack
				direction="row"
				// At `xs`, two adjacent outlined pills read as one shape.
				gap="sm"
				align="flex-start"
				justify="flex-start"
				wrap="wrap"
				className={ clsx( 'editor-collab-sidebar-panel__reactions', {
					'is-floating': ! entries.length,
				} ) }
			>
				{ entries.map( ( [ hexKey, entry ] ) => (
					<ReactionButton
						key={ hexKey }
						hexKey={ hexKey }
						count={ entry.count }
						isActive={ entry.current_user_reaction > 0 }
						names={ reactorNames?.[ hexKey ] }
						disabled={ disabled }
						onToggle={ toggleReaction }
						onShowNames={ showNames }
					/>
				) ) }
				{ /*
				 * Same tree position with or without pills: moving it when the
				 * first reaction lands would remount the open picker's trigger.
				 */ }
				{ canReact && (
					<Menu.Root>
						<Menu.Trigger
							render={
								<IconButton
									size="small"
									variant="minimal"
									tone="neutral"
									className="editor-collab-sidebar-panel__add-reaction-button"
									icon={ reactionIcon }
									label={ __( 'Add reaction' ) }
								/>
							}
						/>
						<Menu.Popup
							aria-label={ __( 'Add reaction' ) }
							positioner={
								<Menu.Positioner side="bottom" align="end" />
							}
						>
							{ REACTION_EMOJIS.map(
								( { emoji, hexKey, label } ) => (
									<Menu.CheckboxItem
										key={ hexKey }
										checked={
											!! reactions?.[ hexKey ]
												?.current_user_reaction
										}
										onCheckedChange={ () =>
											toggleReaction( hexKey )
										}
										closeOnClick
										prefix={
											<span className="editor-collab-sidebar-panel__reaction-option-emoji">
												{ emoji }
											</span>
										}
									>
										<Menu.ItemLabel>
											{ label }
										</Menu.ItemLabel>
									</Menu.CheckboxItem>
								)
							) }
						</Menu.Popup>
					</Menu.Root>
				) }
			</Stack>
		</ThemeProvider>
	);
}
