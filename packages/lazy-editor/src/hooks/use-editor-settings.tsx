/**
 * WordPress dependencies
 */
import { generateGlobalStyles } from '@wordpress/global-styles-engine';
import apiFetch from '@wordpress/api-fetch';
import { store as coreDataStore } from '@wordpress/core-data';
import { useEffect, useMemo, useState } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useUserGlobalStyles } from './use-global-styles';
import { unlock } from '../lock-unlock';

type EditorContext = 'post-editor' | 'site-editor';

const settingsPromises = new Map<
	EditorContext,
	Promise< Record< string, any > >
>();

async function fetchEditorSettings( context: EditorContext ) {
	if ( ! settingsPromises.has( context ) ) {
		settingsPromises.set(
			context,
			apiFetch< Record< string, any > >( {
				path: addQueryArgs( '/wp-block-editor/v1/settings', {
					context,
				} ),
			} )
		);
	}

	return settingsPromises.get( context ) as Promise< Record< string, any > >;
}

/**
 * This is a React hook that provides the editor settings from the REST API.
 *
 * @param {Object} props            - The props object.
 * @param {string} [props.stylesId] - The ID of the user's global styles to use.
 * @param {string} [props.context]  - The editor context to load settings for.
 * @return Editor settings.
 */
export function useEditorSettings( {
	stylesId,
	context = 'post-editor',
}: {
	stylesId: string;
	context?: EditorContext;
} ) {
	const coreEditorSettings = useSelect(
		( select ) => ( {
			editorSettings: unlock(
				select( coreDataStore )
			).getEditorSettings(),
		} ),
		[]
	);
	const [ contextualEditorSettings, setContextualEditorSettings ] =
		useState< Record< string, any > | null >( null );

	useEffect( () => {
		if ( context === 'post-editor' ) {
			return;
		}

		let isMounted = true;
		fetchEditorSettings( context ).then( ( fetchedSettings ) => {
			if ( isMounted ) {
				setContextualEditorSettings( fetchedSettings );
			}
		} );

		return () => {
			isMounted = false;
		};
	}, [ context ] );

	const editorSettings =
		context === 'post-editor'
			? coreEditorSettings.editorSettings
			: contextualEditorSettings;

	const { user: globalStyles } = useUserGlobalStyles( stylesId );
	const [ globalStylesCSS ] = generateGlobalStyles( globalStyles );

	const hasEditorSettings = !! editorSettings;
	const styles = useMemo( () => {
		if ( ! hasEditorSettings ) {
			return [];
		}
		return [
			...( ( editorSettings?.styles as Array< any > ) ?? [] ),
			...globalStylesCSS,
		];
	}, [ hasEditorSettings, editorSettings?.styles, globalStylesCSS ] );

	return {
		isReady: hasEditorSettings,
		editorSettings: useMemo(
			() => ( {
				...( editorSettings ?? {} ),
				styles,
			} ),
			[ editorSettings, styles ]
		),
	};
}
