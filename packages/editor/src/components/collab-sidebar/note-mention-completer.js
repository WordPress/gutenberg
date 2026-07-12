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
 * A user mention completer for notes.
 *
 * Mirrors the editor's `@` user completer but inserts a link carrying the
 * mentioned user's ID (`data-user-id`) so the mention can be styled as a chip
 * and, in a follow-up, resolved to a notification recipient. The user query is
 * filterable so integrators can narrow the mentionable audience (e.g. to
 * editors or contributors).
 *
 * @type {Object}
 */
const noteMentionCompleter = {
	name: 'note-mentions',
	className: 'editor-autocompleters__user',
	triggerPrefix: '@',

	useItems( filterValue ) {
		const users = useSelect(
			( select ) => {
				/**
				 * Filters the query used to fetch mentionable users in notes.
				 *
				 * Defaults to all site users. Return a modified query to narrow
				 * the audience, e.g. `{ ...query, roles: [ 'editor' ] }` (in
				 * `edit` context) or `{ ...query, who: 'authors' }`.
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
					},
					filterValue
				);

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

		return [ options ];
	},

	getOptionCompletion( user ) {
		return {
			action: 'insert-at-caret',
			value: (
				<a
					className="wp-note-mention"
					data-user-id={ user.id }
					href={ user.link }
				>
					{ '@' + user.name }
				</a>
			),
		};
	},
};

export default noteMentionCompleter;
