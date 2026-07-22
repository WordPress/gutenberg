/**
 * External dependencies
 */
import type { MouseEvent } from 'react';

/**
 * WordPress dependencies
 */
import { __, sprintf, _n } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { useState, useCallback, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	hexKeyToEmoji,
	buildEmojiBySlugMap,
	useReactionEmojis,
} from './reaction-emoji-picker';
import { useEmojiLabel } from './emojibase-data';

/**
 * A single slug's entry in the reaction summary: how many reactions it
 * has and whether the current user is among them.
 */
interface ReactionSummaryEntry {
	count: number;
	reacted?: boolean;
}

/**
 * The reaction summary keyed by storage slug (curated slug or hex key).
 */
type ReactionSummary = Record< string, ReactionSummaryEntry >;

/**
 * A comment record as returned by the reactions REST query.
 */
interface ReactionComment {
	author_name: string;
	content: string | { raw?: string; rendered?: string };
}

/**
 * Get the count of reactions for a specific slug.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @param slug      The reaction slug to count.
 * @return The count of reactions.
 */
function getReactionCount(
	reactions: ReactionSummary | null | undefined,
	slug: string
): number {
	return reactions?.[ slug ]?.count || 0;
}

/**
 * Check if the current user has reacted with a specific slug.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @param slug      The reaction slug to check.
 * @return Whether the user has reacted.
 */
function hasUserReacted(
	reactions: ReactionSummary | null | undefined,
	slug: string
): boolean {
	return reactions?.[ slug ]?.reacted || false;
}

/**
 * Get all reaction slugs that have reactions.
 *
 * @param reactions The reactions summary (keyed by slug).
 * @return Array of slugs with reactions.
 */
function getReactedSlugs(
	reactions: ReactionSummary | null | undefined
): string[] {
	if ( ! reactions ) {
		return [];
	}
	return Object.keys( reactions ).filter(
		( slug ) => reactions[ slug ]?.count > 0
	);
}

/**
 * Generate GitHub-style tooltip text from user names.
 *
 * @param names      Array of user display names.
 * @param emojiLabel The emoji label.
 * @return The tooltip text.
 */
function formatReactionTooltip( names: string[], emojiLabel: string ): string {
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

// Module-level cache for reaction details: { "noteId:slug": string[] }
const reactionNamesCache: Record< string, string[] > = {};

/**
 * Drop the cached reactor names for a note/slug pair. Called whenever a
 * reaction is added or removed, since that changes the set of users the
 * tooltip lists.
 *
 * @param noteId The parent note comment ID.
 * @param slug   The reaction slug.
 */
export function invalidateReactionNames( noteId: number, slug: string ): void {
	delete reactionNamesCache[ `${ noteId }:${ slug }` ];
}

interface ReactionButtonProps {
	noteId: number;
	slug: string;
	count: number;
	isActive: boolean;
	emoji: string;
	emojiLabel?: string;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * A single reaction pill button that lazy-loads user names on hover.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.slug             The emoji slug.
 * @param props.count            The reaction count.
 * @param props.isActive         Whether the current user reacted.
 * @param props.emoji            The emoji character.
 * @param props.emojiLabel       The emoji label, if known (curated reactions
 *                               only).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
function ReactionButton( {
	noteId,
	slug,
	count,
	isActive,
	emoji,
	emojiLabel,
	onToggleReaction,
}: ReactionButtonProps ) {
	const [ names, setNames ] = useState< string[] | null >( null );
	const [ isFetching, setIsFetching ] = useState( false );
	// Reactions picked from the full picker are stored as hex keys and
	// carry no curated label; resolve their name from the Emojibase
	// dataset so tooltips read "thumbs up" rather than echoing the "👍"
	// character. Falls back to the emoji character until resolved.
	const resolvedLabel = useEmojiLabel( slug, ! emojiLabel );
	const label = emojiLabel || resolvedLabel || emoji;
	// Derive the tooltip from the fetched names and the *current* label
	// rather than storing a formatted string: the names request and the
	// Emojibase label request race, and a stored string would freeze
	// whichever label happened to be resolved first.
	const tooltipText =
		names && names.length > 0 ? formatReactionTooltip( names, label ) : '';

	const fetchReactionNames = useCallback( () => {
		const cacheKey = `${ noteId }:${ slug }`;
		if ( reactionNamesCache[ cacheKey ] ) {
			setNames( reactionNamesCache[ cacheKey ] );
			return;
		}

		if ( isFetching ) {
			return;
		}

		setIsFetching( true );
		apiFetch< ReactionComment[] >( {
			path: addQueryArgs( '/wp/v2/comments', {
				parent: noteId,
				type: 'reaction',
				status: 'all',
				per_page: 100,
				_fields: 'author_name,content',
			} ),
		} )
			.then( ( reactions ) => {
				const fetchedNames = reactions
					.filter( ( r ) => {
						const content =
							typeof r.content === 'object'
								? r.content?.raw || r.content?.rendered
								: r.content;
						const clean = content
							?.replace?.( /<[^>]*>/g, '' )
							?.trim();
						return clean === slug;
					} )
					.map( ( r ) => r.author_name );

				reactionNamesCache[ cacheKey ] = fetchedNames;
				setNames( fetchedNames );
			} )
			.catch( () => {
				// Silently fall back to count-based label.
			} )
			.finally( () => {
				setIsFetching( false );
			} );
	}, [ noteId, slug, isFetching ] );

	const defaultLabel = sprintf(
		/* translators: 1: emoji label, 2: count of reactions */
		_n( '%1$s, %2$d reaction', '%1$s, %2$d reactions', count ),
		label,
		count
	);

	return (
		<Button
			variant="secondary"
			size="small"
			className="editor-collab-sidebar-panel__reaction-button"
			onClick={ ( event: MouseEvent< HTMLElement > ) => {
				event.stopPropagation();
				// When removing the last reaction for this emoji,
				// the button will disappear. Move focus to the
				// parent note to prevent focus loss.
				if ( isActive && count === 1 ) {
					( event.target as HTMLElement )
						.closest< HTMLElement >(
							'.editor-collab-sidebar-panel__thread'
						)
						?.focus();
				}
				// Invalidate cached names since the reaction set is changing.
				invalidateReactionNames( noteId, slug );
				setNames( null );
				onToggleReaction( slug );
			} }
			onMouseEnter={ fetchReactionNames }
			onFocus={ fetchReactionNames }
			isPressed={ isActive }
			label={ tooltipText || defaultLabel }
			showTooltip
		>
			<span className="editor-collab-sidebar-panel__reaction-button-emoji">
				{ emoji }
			</span>
			<span>{ count }</span>
		</Button>
	);
}

interface ReactionDisplayProps {
	noteId: number;
	reactions: ReactionSummary | null | undefined;
	onToggleReaction: ( slug: string ) => void;
}

/**
 * Display current reactions with counts as pill-shaped buttons.
 *
 * @param props                  Component props.
 * @param props.noteId           The parent note comment ID.
 * @param props.reactions        The reaction summary (keyed by slug).
 * @param props.onToggleReaction Callback to toggle a reaction.
 */
export default function ReactionDisplay( {
	noteId,
	reactions,
	onToggleReaction,
}: ReactionDisplayProps ) {
	// The list is filterable server-side (and static per page load),
	// so index it once per list identity.
	const emojis = useReactionEmojis();
	const emojiBySlug = useMemo(
		() => buildEmojiBySlugMap( emojis ),
		[ emojis ]
	);
	const reactedSlugs = getReactedSlugs( reactions );

	if ( reactedSlugs.length === 0 ) {
		return null;
	}

	return (
		// `sm` gap: the pressed pills draw a full accent border, and at
		// the `xs` gap adjacent borders read as touching.
		<Stack direction="row" gap="sm" justify="flex-start" wrap="wrap">
			{ reactedSlugs.map( ( slug ) => {
				const count = getReactionCount( reactions, slug );
				const isActive = hasUserReacted( reactions, slug );
				const entry = emojiBySlug.get( slug );

				return (
					<ReactionButton
						key={ slug }
						noteId={ noteId }
						slug={ slug }
						count={ count }
						isActive={ isActive }
						emoji={ entry?.emoji ?? hexKeyToEmoji( slug ) }
						emojiLabel={ entry?.label }
						onToggleReaction={ onToggleReaction }
					/>
				);
			} ) }
		</Stack>
	);
}
