/**
 * WordPress dependencies
 */
import { isURL } from '@wordpress/url';
import { useSelect } from '@wordpress/data';
import { useEffect, useCallback, useState, useMemo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as blockEditorStore } from '../../store';

async function resolveThemeJSONFileURIs( config, stylesheetURI, templateURI ) {
	// Array to store promises of fetch operations
	const fetchPromises = [];
	const updatedConfig = JSON.parse( JSON.stringify( config ) )


	if ( config?.styles?.background?.backgroundImage?.url && ! isURL( config?.styles?.background?.backgroundImage?.url ) ) {
		let trimmedFile = config?.styles?.background?.backgroundImage?.url.trim();
		trimmedFile = trimmedFile.startsWith( '/' ) ? trimmedFile : `/${ trimmedFile }`;
		const activeThemeFileURL = `${ stylesheetURI }${ encodeURIComponent( trimmedFile ) }`;
		fetchPromises.push(
		apiFetch( { url: activeThemeFileURL, method: 'HEAD', parse: false } )
			.then( () => {
				updatedConfig.styles.background.backgroundImage.url = activeThemeFileURL;
			} )
			.catch( () => {
				updatedConfig.styles.background.backgroundImage.url = `${ templateURI }${ trimmedFile }`;
			} )
		);
	}

	if ( config?.styles?.blocks ) {
		Object.entries( config.styles.blocks ).forEach( ( [ blockName, blockStyles ] ) => {
			if ( blockStyles?.background?.backgroundImage?.url && ! isURL( blockStyles?.background?.backgroundImage?.url ) ) {
				let trimmedFile = blockStyles?.background?.backgroundImage?.url.trim();
				trimmedFile = trimmedFile.startsWith( '/' ) ? trimmedFile : `/${ trimmedFile }`;
				const activeThemeFileURL = `${ stylesheetURI }${ encodeURIComponent( trimmedFile ) }`;
				fetchPromises.push(
					apiFetch( { url: activeThemeFileURL, method: 'HEAD', parse: false } )
						.then( () => {
							updatedConfig.styles.blocks[ blockName ].background.backgroundImage.url = activeThemeFileURL;
						} )
						.catch( () => {
							updatedConfig.styles.blocks[ blockName ].background.backgroundImage.url = `${ templateURI }${ trimmedFile }`;
						} )
				);
			}
		} );
	}

	// Wait for all fetch operations to complete
	await Promise.allSettled( fetchPromises );
	console.log( 'Promise updatedConfig', updatedConfig );
	// Return the updated object
	return updatedConfig;
}


export default function useResolveThemeFileURIs( mergedConfig ) {
	// let updatedConfig = useRef();
	const { stylesheetURI, templateURI } = useSelect( ( select ) => {
		const { currentTheme } = select( blockEditorStore ).getSettings();
		return {
			stylesheetURI: currentTheme?.stylesheetURI,
			templateURI: currentTheme?.templateURI,
		};
	} );
	const [ config, setConfig ] = useState( mergedConfig );

	useEffect(() => {
		if ( ! mergedConfig || ! stylesheetURI || ! templateURI ) {
			return;
		}

		( async () => {
			try {
				const newConfig = await resolveThemeJSONFileURIs( mergedConfig, stylesheetURI, templateURI );
				setConfig( newConfig );
			} catch ( err ) { }
		})();
	}, [ stylesheetURI, templateURI, mergedConfig?.styles?.background?.backgroundImage?.url, mergedConfig?.styles?.['core/group']?.background?.backgroundImage?.url ] );

	return useMemo( () => {
		if ( ! config ) {
			return mergedConfig;
		}
		return config;
	}, [ config, mergedConfig ] );
}
