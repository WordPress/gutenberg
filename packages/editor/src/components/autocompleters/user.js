/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/** @typedef {import('@wordpress/components').WPCompleter} WPCompleter */

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
 * @type {WPCompleter}
 */
export default {
	name: 'users',
	className: 'editor-autocompleters__user',
	triggerPrefix: '@',

	allowContext( before ) {
		// Triggers when at the beginning of a context or when the immediately preceding character is a space.
		return /^$/.test( before ) || /^\s$/.test( before.slice( -1 ) );
	},

	useItems( filterValue ) {
		const users = useSelect(
			( select ) => {
				const { getUsers } = select( coreStore );
				return getUsers( {
					context: 'view',
					search: encodeURIComponent( filterValue ),
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
