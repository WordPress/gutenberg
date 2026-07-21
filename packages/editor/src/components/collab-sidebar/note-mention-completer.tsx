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
	link: string;
};

/**
 * A user mention completer for notes.
 *
 * Mirrors the editor's `@` user completer but inserts the mention as a link
 * to the user's author page, carrying the mentioned user's ID in a
 * `data-wp-note-mention-user` attribute so the mention can be styled as a chip
 * and, in a follow-up, resolved to a notification recipient. A purpose-specific
 * data attribute (rather than a class) keeps the kses allowance inert - it is
 * not a CSS or JavaScript selector hook outside the notes sidebar. A plain
 * `core/link` format handles the anchor, so no dedicated mention format is
 * needed.
 */
const noteMentionCompleter = {
	name: 'note-mentions',
	className:
		'editor-autocompleters__user editor-collab-sidebar-panel__mention-suggestion',
	triggerPrefix: '@',

	useItems( filterValue: string ) {
		const users = useSelect(
			( select ) => {
				const { getUsers } = select( coreStore );
				return getUsers( {
					context: 'view',
					search: filterValue,
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
				<a
					data-wp-note-mention-user={ String( user.id ) }
					href={ user.link }
				>
					{ '@' + user.name }
				</a>
			),
		};
	},
};

export default noteMentionCompleter;
