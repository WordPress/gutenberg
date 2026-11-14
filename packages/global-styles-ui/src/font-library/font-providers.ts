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
 * Identifies a font card across sources.
 *
 * The same family slug can appear in the theme, among installed fonts and in
 * several providers, so the slug alone does not tell the cards apart.
 *
 * @param font         Font family, with its `source`.
 * @param providerSlug Slug of the provider that supplies the font, if any.
 * @return A key that is unique within the Font Library list.
 */
export function getFontCardKey( font: FontFamily, providerSlug?: string ) {
	return [ font.source ?? '', providerSlug ?? '', font.slug ].join( '/' );
}

/**
 * Fetches the registered font providers.
 *
 * `hasResolved` stays false until the request settles, so callers can hold
 * back an empty state. A failed request resolves to no providers, which
 * leaves the Font Library as it is without them.
 *
 * @return The providers, and whether the request has settled.
 */
export function useFontProviders(): {
	providers: FontProvider[];
	hasResolved: boolean;
} {
	const [ state, setState ] = useState< {
		providers: FontProvider[];
		hasResolved: boolean;
	} >( { providers: [], hasResolved: false } );

	useEffect( () => {
		let isMounted = true;
		apiFetch< FontProviderResponse[] >( { path: '/wp/v2/font-providers' } )
			.then( ( response ) =>
				response.map( ( provider ) => ( {
					slug: provider.slug,
					label: provider.label,
					description: provider.description,
					fontFamilies: provider.font_families
						.map( ( family ) =>
							setUIValuesNeeded( family, { source: 'plugin' } )
						)
						.sort( ( a, b ) => a.name.localeCompare( b.name ) ),
				} ) )
			)
			.catch( (): FontProvider[] => [] )
			.then( ( providers ) => {
				if ( isMounted ) {
					setState( { providers, hasResolved: true } );
				}
			} );
		return () => {
			isMounted = false;
		};
	}, [] );

	return state;
}
