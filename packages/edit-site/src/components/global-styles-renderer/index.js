/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { TEMPLATE_POST_TYPE } from '../../utils/constants';

const { useGlobalStylesOutput } = unlock( blockEditorPrivateApis );

function useGlobalStylesRenderer() {
	const postType = useSelect( ( select ) => {
		return select( editSiteStore ).getEditedPostType();
	} );
	const [ styles, settings ] = useGlobalStylesOutput(
		postType !== TEMPLATE_POST_TYPE
	);
	const { getSettings } = useSelect( editSiteStore );
	const { updateSettings } = useDispatch( editSiteStore );

	useEffect( () => {
		if ( ! styles || ! settings ) {
			return;
		}

		const currentStoreSettings = getSettings();
		const nonGlobalStyles = Object.values(
			currentStoreSettings.styles ?? []
		).filter( ( style ) => ! style.isGlobalStyles );
		updateSettings( {
			...currentStoreSettings,
			styles: [ ...nonGlobalStyles, ...styles ],
			__experimentalFeatures: settings,
		} );
	}, [ styles, settings, updateSettings, getSettings ] );
}

export function GlobalStylesRenderer() {
	useGlobalStylesRenderer();

	return null;
}
