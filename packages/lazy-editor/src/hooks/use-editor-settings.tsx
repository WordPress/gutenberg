import { generateGlobalStyles } from '@wordpress/global-styles-engine';
import { store as coreDataStore } from '@wordpress/core-data';
import { store as blocksStore } from '@wordpress/blocks';
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
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
	const { editorSettings, blockTypes } = useSelect(
		( select ) => ( {
			editorSettings: unlock(
				select( coreDataStore )
			).getEditorSettings(),
			blockTypes: select( blocksStore ).getBlockTypes(),
		} ),
		[]
	);

	const { user: globalStyles } = useUserGlobalStyles( stylesId );
	/*
	 * Building the stylesheet walks every registered block, so it is memoized
	 * rather than repeated on each render. The blocks are read from the store
	 * and passed in rather than left to the fallback inside, so that the ones
	 * registering after this first runs invalidate the result: nothing else
	 * here changes when they arrive.
	 */
	const [ globalStylesCSS ] = useMemo(
		() => generateGlobalStyles( globalStyles, blockTypes ),
		[ globalStyles, blockTypes ]
	);

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
