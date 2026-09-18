import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import type { FontFamily } from '@wordpress/core-data';
import { setUIValuesNeeded } from './utils';

/**
 * A font provider as returned by `/wp/v2/font-providers`.
 *
 * Provider fonts are supplied by an active extension. The Font Library lists
 * them read-only: they are not installed, activated or deleted here.
 */
export interface FontProvider {
	slug: string;
	label: string;
	description: string;
	fontFamilies: FontFamily[];
}

interface FontProviderResponse {
	slug: string;
	label: string;
	description: string;
	font_families: FontFamily[];
}

/**
 * Fetches the registered font providers.
 *
 * Returns an empty list when the endpoint is missing or the request fails, so
 * the Font Library behaves as before when no provider is registered.
 */
export function useFontProviders(): FontProvider[] {
	const [ providers, setProviders ] = useState< FontProvider[] >( [] );

	useEffect( () => {
		let isMounted = true;
		apiFetch< FontProviderResponse[] >( { path: '/wp/v2/font-providers' } )
			.then( ( response ) => {
				if ( ! isMounted ) {
					return;
				}
				setProviders(
					response.map( ( provider ) => ( {
						slug: provider.slug,
						label: provider.label,
						description: provider.description,
						fontFamilies: provider.font_families
							.map( ( family ) =>
								setUIValuesNeeded( family, {
									source: 'plugin',
								} )
							)
							.sort( ( a, b ) => a.name.localeCompare( b.name ) ),
					} ) )
				);
			} )
			.catch( () => {} );
		return () => {
			isMounted = false;
		};
	}, [] );

	return providers;
}
