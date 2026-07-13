/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { applyFilters } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import { getUserLabel } from '../autocompleters/user';

/**
 * The subset of the REST users response the completion consumes.
 */
type MentionableUser = {
	id: number;
	name: string;
};

/**
 * A user mention completer for notes.
 *
 * Mirrors the editor's `@` user completer but inserts a span carrying the
 * mentioned user's ID (`data-user-id`) so the mention can be styled as a chip
 * and, in a follow-up, resolved to a notification recipient. A mention marks
 * a person, it isn't a navigation affordance, so it is deliberately not a
 * link. The user query is filterable so integrators can narrow the
 * mentionable audience (e.g. to editors or contributors).
 */
const noteMentionCompleter = {
	name: 'note-mentions',
	className:
		'editor-autocompleters__user editor-collab-sidebar-panel__mention-suggestion',
	triggerPrefix: '@',

	useItems( filterValue: string ) {
		const users = useSelect(
			( select ) => {
				// Suggesting the note's own author to themselves is noise;
				// leave the current user out of the default query.
				const currentUserId = select( coreStore ).getCurrentUser()?.id;

				/**
				 * Filters the query used to fetch mentionable users in notes.
				 *
				 * Defaults to all site users except the current one. Return a
				 * modified query to change the audience, e.g.
				 * `{ ...query, roles: [ 'editor' ] }` (in `edit` context) or
				 * `{ ...query, who: 'authors' }`.
				 *
				 * @param {Object} query       The `getUsers` query arguments.
				 * @param {string} filterValue The current mention search text.
				 */
				const query = applyFilters(
					'editor.notes.mentionUserQuery',
					{
						context: 'view',
						search: encodeURIComponent( filterValue ),
						per_page: 10,
						...( currentUserId
							? { exclude: [ currentUserId ] }
							: {} ),
					},
					filterValue
				) as Record< string, unknown >;

				return select( coreStore ).getUsers( query );
			},
			[ filterValue ]
		);

		const options = useMemo(
			() =>
				users
					? users.map( ( user ) => ( {
							key: `note-mention-${ user.slug }`,
							value: user,
							label: getUserLabel( user ),
					  } ) )
					: [],
			[ users ]
		);

		return [ options ] as const;
	},

	getOptionCompletion( user: MentionableUser ) {
		return {
			action: 'insert-at-caret' as const,
			value: (
				<span className="wp-note-mention" data-user-id={ user.id }>
					{ '@' + user.name }
				</span>
			),
		};
	},
};

export default noteMentionCompleter;
