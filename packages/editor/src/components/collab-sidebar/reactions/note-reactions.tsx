import clsx from 'clsx';
import type { MouseEvent } from 'react';
import { __, sprintf, _n } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import type { Comment } from '@wordpress/core-data';
// eslint-disable-next-line @wordpress/use-recommended-components -- Pending Design System review, see #76135.
import { Button, IconButton, Menu, Stack, Tooltip } from '@wordpress/ui';
import { ThemeProvider } from '@wordpress/theme';
import { reaction as reactionIcon } from '@wordpress/icons';
import { store as editorStore } from '../../../store';
import { REACTION_EMOJIS, getReactionEmoji } from './reaction-emojis';
import { useNoteReactions } from './use-note-reactions';

interface ReactionButtonProps {
	noteId: number;
	hexKey: string;
	count: number;
	isActive: boolean;
	disabled: boolean;
	onToggle: ( hexKey: string ) => void;
}

interface NoteReactionsProps {
	noteId: number;
	canReact: boolean;
	disabled: boolean;
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

function ReactionButton( {
	noteId,
	hexKey,
	count,
	isActive,
	disabled,
	onToggle,
}: ReactionButtonProps ) {
	const [ isShowingNames, setIsShowingNames ] = useState( false );
	// Fetched on hover or focus only; afterwards the cached records are read.
	const reactions = useSelect(
		( select ) => {
			if ( ! isShowingNames ) {
				return null;
			}
			return select( coreStore ).getEntityRecords< Comment< 'edit' > >(
				'root',
				'comment',
				{
					post: select( editorStore ).getCurrentPostId(),
					parent: noteId,
					type: 'reaction',
					status: 'all',
					per_page: -1,
					_fields: 'id,author_name,content',
				}
			);
		},
		[ isShowingNames, noteId ]
	);
	const names = reactions
		?.filter( ( reaction ) => reaction.content.raw === hexKey )
		.map( ( reaction ) => reaction.author_name );
	const emoji = getReactionEmoji( hexKey );
	const emojiLabel = emoji?.label ?? hexKey;
	// Names that don't add up to the count are stale until the refetch lands.
	const label =
		names?.length === count
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
						onMouseEnter={ () => setIsShowingNames( true ) }
						onMouseLeave={ () => setIsShowingNames( false ) }
						onFocus={ () => setIsShowingNames( true ) }
						onBlur={ () => setIsShowingNames( false ) }
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
	const entries = Object.entries( reactions ?? {} );

	if ( ! entries.length && ! canReact ) {
		return null;
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
						noteId={ noteId }
						hexKey={ hexKey }
						count={ entry.count }
						isActive={ entry.current_user_reaction > 0 }
						disabled={ disabled }
						onToggle={ toggleReaction }
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
