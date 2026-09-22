import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Renders a user label for the autocompleter.
 *
 * @param {Object} user User object.
 * @return {React.JSX.Element} User label component.
 */
export function getUserLabel( user ) {
	const avatar =
		user.avatar_urls && user.avatar_urls[ 24 ] ? (
			<img
				className="editor-autocompleters__user-avatar"
				alt=""
				src={ user.avatar_urls[ 24 ] }
			/>
		) : (
			<span className="editor-autocompleters__no-avatar"></span>
		);

	return (
		<>
			{ avatar }
			<span className="editor-autocompleters__user-name">
				{ user.name }
			</span>
			<span className="editor-autocompleters__user-slug">
				{ user.slug }
			</span>
		</>
	);
}

/**
 * A user mentions completer.
 *
 * @type {Object}
 */
export default {
	name: 'users',
	className: 'editor-autocompleters__user',
	triggerPrefix: '@',

	allowContext( before ) {
		// Only trigger when the preceding character is not a word character,
		// so typing an email address does not open the mention popup, while
		// mentions still work at the start of a line or after spaces and
		// punctuation such as an opening parenthesis.
		return /\B$/.test( before );
	},

	useItems( filterValue ) {
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
							key: `user-${ user.slug }`,
							value: user,
							label: getUserLabel( user ),
						} ) )
					: [],
			[ users ]
		);

		return [ options ];
	},

	getOptionCompletion( user ) {
		return `@${ user.slug }`;
	},
};
