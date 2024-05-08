/**
 * WordPress dependencies
 */
import { isURL, isValidPath } from '@wordpress/url';
import { useSelect } from '@wordpress/data';
import { useEffect, useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

const resolvedURIsCache = new Map();

function isRelativePath( url ) {
	return isValidPath( url ) && ! isURL( url );
}

function getThemeFileURIs( file, stylesheetURI, templateURI ) {
	file = file.trim();
	file = file.startsWith( '/' ) ? file : `/${ file }`;
	return [ `${ stylesheetURI }${ file }`, `${ templateURI }${ file }` ];
}

function fetchThemeFileURI( url, { onSuccess, onError, onFinally } ) {
	if ( ! isURL( url ) || ! window?.fetch ) {
		return null;
	}
	return window
		.fetch( url, { method: 'HEAD', mode: 'same-origin' } )
		.then( onSuccess )
		.catch( onError )
		.finally( onFinally );
}

async function resolveThemeJSONFileURIs(
	relativePaths,
	stylesheetURI,
	templateURI,
	themeStylesheet
) {
	const fetchPromises = [];
	const unresolvedPaths = [ ...relativePaths ];
	if ( relativePaths?.length ) {
		relativePaths.forEach( ( path ) => {
			const cacheKey = `${ themeStylesheet }-${ path }`;
			if ( ! resolvedURIsCache.has( cacheKey ) ) {
				const [ activeThemeFileURL, defaultThemeFileURL ] =
					getThemeFileURIs( path, stylesheetURI, templateURI );
				fetchPromises.push(
					fetchThemeFileURI( activeThemeFileURL, {
						onSuccess: () => {
							resolvedURIsCache.set(
								cacheKey,
								activeThemeFileURL
							);
						},
						onError: () => {
							resolvedURIsCache.set(
								cacheKey,
								defaultThemeFileURL
							);
						},
						onFinally: () => {
							const index = unresolvedPaths.indexOf( path );
							unresolvedPaths.splice( index, 1 );
						},
					} )
				);
			}
		} );
	}
	/*

	// Top-level styles.
	if ( isRelativePath( config?.styles?.background?.backgroundImage?.url ) ) {
		const cacheKey = `${ themeStylesheet }-${ config.styles.background.backgroundImage.url }`;
		if ( ! resolvedURIsCache.has( cacheKey ) ) {
			const [ activeThemeFileURL, defaultThemeFileURL ] =
				getThemeFileURIs(
					config.styles.background.backgroundImage.url,
					stylesheetURI,
					templateURI
				);

			fetchPromises.push(
				fetchThemeFileURI( activeThemeFileURL, {
					onSuccess: () => {
						resolvedURIsCache.set( cacheKey, activeThemeFileURL );
					},
					onError: () => {
						resolvedURIsCache.set( cacheKey, defaultThemeFileURL );
					},
				} )
			);
		}
	}

	// Block styles.
	if (
		config?.styles?.blocks &&
		Object.keys( config.styles.blocks ).length
	) {
		Object.entries( config.styles.blocks ).forEach(
			( [ , blockStyles ] ) => {
				if (
					isRelativePath(
						blockStyles?.background?.backgroundImage?.url
					)
				) {
					const cacheKey = `${ themeStylesheet }-${ blockStyles?.background?.backgroundImage?.url }`;
					if ( ! resolvedURIsCache.has( cacheKey ) ) {
						const [ activeThemeFileURL, defaultThemeFileURL ] =
							getThemeFileURIs(
								blockStyles.background.backgroundImage.url,
								stylesheetURI,
								templateURI
							);
						fetchPromises.push(
							fetchThemeFileURI( activeThemeFileURL, {
								onSuccess: () => {
									resolvedURIsCache.set(
										cacheKey,
										activeThemeFileURL
									);
								},
								onError: () => {
									resolvedURIsCache.set(
										cacheKey,
										defaultThemeFileURL
									);
								},
							} )
						);
					}
				}
			}
		);
	}
*/

	await Promise.allSettled( fetchPromises );
	return unresolvedPaths;
}

function getUnresolvedThemeFilePaths( config, themeStylesheet ) {
	const paths = [];
	if ( isRelativePath( config?.styles?.background?.backgroundImage?.url ) ) {
		const cacheKey = `${ themeStylesheet }-${ config.styles.background.backgroundImage.url }`;
		if ( ! resolvedURIsCache.has( cacheKey ) ) {
			paths.push( config.styles.background.backgroundImage.url );
		}
	}

	if (
		config?.styles?.blocks &&
		Object.keys( config.styles.blocks ).length
	) {
		Object.entries( config.styles.blocks ).forEach(
			( [ , blockStyles ] ) => {
				if (
					isRelativePath(
						blockStyles?.background?.backgroundImage?.url
					)
				) {
					const cacheKey = `${ themeStylesheet }-${ blockStyles?.background?.backgroundImage?.url }`;
					if ( ! resolvedURIsCache.has( cacheKey ) ) {
						paths.push( blockStyles.background.backgroundImage.url );
					}
				}
			}
		);
	}

	return paths;
}

function setResolvedThemeFilePaths( config, themeStylesheet ) {
	if ( isRelativePath( config?.styles?.background?.backgroundImage?.url ) ) {
		const cacheKey = `${ themeStylesheet }-${ config.styles.background.backgroundImage.url }`;
		if ( resolvedURIsCache.has( cacheKey ) ) {
			config.styles.background.backgroundImage.url =
				resolvedURIsCache.get( cacheKey );
		}
	}

	if (
		config?.styles?.blocks &&
		Object.keys( config.styles.blocks ).length
	) {
		Object.entries( config.styles.blocks ).forEach(
			( [ blockName, blockStyles ] ) => {
				if (
					isRelativePath(
						blockStyles?.background?.backgroundImage?.url
					)
				) {
					const cacheKey = `${ themeStylesheet }-${ blockStyles?.background?.backgroundImage?.url }`;
					if ( resolvedURIsCache.has( cacheKey ) ) {
						config.styles.blocks[
							blockName
						].background.backgroundImage.url =
							resolvedURIsCache.get( cacheKey );
					}
				}
			}
		);
	}

	return config;
}

/*
  Ideas:
   Check that this needs to be run before running it by parsing out URLs early?
   Can a function returning an array be a useEffect dependency?
 */
export default function useResolveThemeFileURIs( mergedConfig ) {
	const { stylesheetURI, templateURI, themeStylesheet } = useSelect(
		( select ) => {
			const {
				stylesheet_uri: _stylesheetURI,
				template_uri: _templateURI,
				stylesheet: _themeStylesheet,
			} = unlock( select( blockEditorStore ) ).getCurrentTheme();
			return {
				stylesheetURI: _stylesheetURI,
				templateURI: _templateURI,
				themeStylesheet: _themeStylesheet,
			};
		}
	);

	const [ unresolvedPaths, setUnresolvedPaths ] = useState(
		getUnresolvedThemeFilePaths( mergedConfig, themeStylesheet )
	);

	useEffect( () => {
		if (
			! mergedConfig?.styles ||
			! unresolvedPaths?.length ||
			! stylesheetURI ||
			! templateURI ||
			! themeStylesheet
		) {
			return;
		}

		( async () => {
			try {
				const _unresolvedPaths = await resolveThemeJSONFileURIs(
					unresolvedPaths,
					stylesheetURI,
					templateURI,
					themeStylesheet
				);
				setUnresolvedPaths( _unresolvedPaths );
			} catch ( err ) {}
		} )();
	}, [
		mergedConfig,
		unresolvedPaths,
		setUnresolvedPaths,
		stylesheetURI,
		templateURI,
		themeStylesheet,
	] );

	return setResolvedThemeFilePaths( mergedConfig, themeStylesheet );
}
