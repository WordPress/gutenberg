/**
 * Internal dependencies
 */
import { apiFetch } from './controls';
import { setDiscoverBlocks, setInstallBlocksPermission } from './actions';

export default {
	* getDiscoverBlocks( filterValue ) {
		try {
			const { plugins } = yield apiFetch( {
				path: `__experimental/blocks?search=${ filterValue }`,
			} );
			if ( plugins && plugins.length ) {
				return setDiscoverBlocks( plugins.map( ( p ) => {
					return {
						...p,
						id: p.slug,
						description: p.description.replace( /<\/?[^>]+(>|$)/g, '' ), // strips all html tag
						title: p.name,
						ratingCount: p.num_ratings,
						activeInstalls: p.active_installs,
						author: p.author.replace( /<\/?[^>]+(>|$)/g, '' ),
					};
				} ), filterValue );
			}
			return setDiscoverBlocks( [], filterValue );
		} catch ( error ) {
			if ( error.code === 'rest_user_cannot_view' ) {
				return setInstallBlocksPermission( false );
			}
		}
	},
};
