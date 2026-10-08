import { camelCase } from 'change-case';
import apiFetch from '@wordpress/api-fetch';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { EXCLUDED_PATTERN_SOURCES } from '../../utils/constants';
import { isPreviewingTheme } from '../../utils/is-previewing-theme';
import { unlock } from '../../lock-unlock';
import { store as editSiteStore } from '../../store';

const EMPTY_ARRAY = [];

// Patterns per theme stylesheet, shared by every component for the page load.
const themePatternsCache = new Map();
const themePatternsRequests = new Map();

/**
 * Fetches the patterns registered while a theme is loaded through a theme
 * preview, which boots that theme the same way activating it would. This
 * includes patterns the theme registers from PHP, not only its pattern files.
 *
 * @param {string} stylesheet Theme stylesheet.
 * @return {Promise<Array>} Registered patterns.
 */
function fetchThemePatterns( stylesheet ) {
	if ( ! themePatternsRequests.has( stylesheet ) ) {
		themePatternsRequests.set(
			stylesheet,
			apiFetch( {
				path: addQueryArgs( '/wp/v2/block-patterns/patterns', {
					wp_theme_preview: stylesheet,
				} ),
			} )
				.then( ( patterns ) =>
					patterns.map( ( pattern ) =>
						Object.fromEntries(
							Object.entries( pattern ).map(
								( [ key, value ] ) => [
									camelCase( key ),
									value,
								]
							)
						)
					)
				)
				.catch( () => EMPTY_ARRAY )
				.then( ( patterns ) => {
					themePatternsCache.set( stylesheet, patterns );
					return patterns;
				} )
		);
	}
	return themePatternsRequests.get( stylesheet );
}

/**
 * Returns the installed themes, other than the active theme and its parent,
 * along with the patterns each one would add if it were activated.
 *
 * @return {{themes: Array, isResolving: boolean}} Themes with their patterns.
 */
export default function useInstalledThemePatterns() {
	const { installedThemes, currentTheme, settings, activePatterns } =
		useSelect( ( select ) => {
			const {
				getEntityRecords,
				getCurrentTheme,
				getBlockPatterns,
				hasFinishedResolution,
			} = select( coreStore );
			const blockPatterns = getBlockPatterns();
			return {
				installedThemes: getEntityRecords( 'root', 'theme' ),
				currentTheme: getCurrentTheme(),
				settings: unlock( select( editSiteStore ) ).getSettings(),
				activePatterns: hasFinishedResolution( 'getBlockPatterns' )
					? blockPatterns
					: undefined,
			};
		}, [] );

	const candidateThemes = useMemo( () => {
		if ( isPreviewingTheme() || ! installedThemes || ! currentTheme ) {
			return EMPTY_ARRAY;
		}
		return installedThemes
			.filter(
				( theme ) =>
					theme.stylesheet !== currentTheme.stylesheet &&
					theme.stylesheet !== currentTheme.template
			)
			.sort( ( a, b ) => a.name.raw.localeCompare( b.name.raw ) );
	}, [ installedThemes, currentTheme ] );

	const [ patternsByTheme, setPatternsByTheme ] = useState( () =>
		Object.fromEntries( themePatternsCache )
	);

	useEffect( () => {
		let isMounted = true;
		candidateThemes.forEach( ( { stylesheet } ) => {
			fetchThemePatterns( stylesheet ).then( ( patterns ) => {
				if ( isMounted ) {
					setPatternsByTheme( ( current ) =>
						current[ stylesheet ] === patterns
							? current
							: { ...current, [ stylesheet ]: patterns }
					);
				}
			} );
		} );
		return () => {
			isMounted = false;
		};
	}, [ candidateThemes ] );

	return useMemo( () => {
		if ( ! activePatterns ) {
			return { themes: EMPTY_ARRAY, isResolving: true };
		}

		// Core, plugin and active theme patterns are already available, so
		// only keep what each theme would add on top of them.
		const settingsPatterns =
			settings.__experimentalAdditionalBlockPatterns ??
			settings.__experimentalBlockPatterns ??
			EMPTY_ARRAY;
		const activePatternNames = new Set(
			[ ...settingsPatterns, ...activePatterns ].map(
				( pattern ) => pattern.name
			)
		);

		const themes = candidateThemes
			.filter( ( { stylesheet } ) => patternsByTheme[ stylesheet ] )
			.map( ( theme ) => ( {
				stylesheet: theme.stylesheet,
				name: theme.name.raw,
				// Folders the theme's files can be loaded from.
				uris: [
					...new Set( [ theme.stylesheet_uri, theme.template_uri ] ),
				],
				patterns: patternsByTheme[ theme.stylesheet ].filter(
					( pattern ) =>
						! activePatternNames.has( pattern.name ) &&
						! EXCLUDED_PATTERN_SOURCES.includes( pattern.source ) &&
						pattern.inserter !== false
				),
			} ) )
			.filter( ( theme ) => theme.patterns.length );

		return {
			themes,
			isResolving: candidateThemes.some(
				( { stylesheet } ) => ! patternsByTheme[ stylesheet ]
			),
		};
	}, [ activePatterns, settings, candidateThemes, patternsByTheme ] );
}
