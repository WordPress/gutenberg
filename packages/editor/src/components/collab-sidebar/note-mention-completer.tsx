/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

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
 * mentioned user's ID in a `user-N` class so the mention can be styled as a
 * chip and, in a follow-up, resolved to a notification recipient. A mention
 * marks a person, it isn't a navigation affordance, so it is deliberately not
 * a link.
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
				// leave the current user out of the query.
				const currentUserId = select( coreStore ).getCurrentUser()?.id;

				return select( coreStore ).getUsers( {
					context: 'view',
					search: encodeURIComponent( filterValue ),
					per_page: 10,
					...( currentUserId ? { exclude: [ currentUserId ] } : {} ),
				} );
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
				<span className={ `wp-note-mention user-${ user.id }` }>
					{ '@' + user.name }
				</span>
			),
		};
	},
};

export default noteMentionCompleter;
