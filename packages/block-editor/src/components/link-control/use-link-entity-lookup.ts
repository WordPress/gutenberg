import { useCallback, useState } from '@wordpress/element';
import type { FetchLinkEntity, LinkControlSuggestion } from './types';

/**
 * How long to wait for the lookup before saving the link unbound.
 */
export const LINK_LOOKUP_TIMEOUT = 5000;

/**
 * Looks up what a typed or pasted URL links to on the site.
 *
 * @param fetchLinkEntity The editor's lookup, if it provides one.
 * @return `lookUp`, absent without a lookup to run, and whether one is running.
 */
export default function useLinkEntityLookup(
	fetchLinkEntity: FetchLinkEntity | undefined
) {
	const [ isLookingUp, setIsLookingUp ] = useState( false );

	const lookUp = useCallback(
		async ( url: string ): Promise< LinkControlSuggestion | null > => {
			if ( ! fetchLinkEntity ) {
				return null;
			}
			setIsLookingUp( true );
			let timeout: ReturnType< typeof setTimeout > | undefined;
			try {
				return await Promise.race( [
					fetchLinkEntity( url ),
					new Promise< null >( ( resolve ) => {
						timeout = setTimeout(
							() => resolve( null ),
							LINK_LOOKUP_TIMEOUT
						);
					} ),
				] );
			} catch {
				// A failed lookup leaves the link unbound.
				return null;
			} finally {
				clearTimeout( timeout );
				setIsLookingUp( false );
			}
		},
		[ fetchLinkEntity ]
	);

	return {
		lookUp: fetchLinkEntity ? lookUp : undefined,
		isLookingUp,
	};
}
