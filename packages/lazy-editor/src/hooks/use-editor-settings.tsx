/**
 * WordPress dependencies
 */
import { generateGlobalStyles } from '@wordpress/global-styles-engine';
import { store as coreDataStore } from '@wordpress/core-data';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useUserGlobalStyles } from './use-global-styles';
import { unlock } from '../lock-unlock';

/**
 * This is a React hook that provides the editor settings from the REST API.
 *
 * @param {Object} props            - The props object.
 * @param {string} [props.stylesId] - The ID of the user's global styles to use.
 * @return Editor settings.
 */
export function useEditorSettings( { stylesId }: { stylesId: string } ) {
	const { editorSettings } = useSelect(
		( select ) => ( {
			editorSettings: unlock(
				select( coreDataStore )
			).getEditorSettings(),
		} ),
		[]
	);

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
