/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

export default function ScreenLaunch( { theme, category, variation } ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const { saveEntityRecord } = useDispatch( coreStore );
	const globalStylesId = useSelect( ( select ) => {
		return select( coreStore ).__experimentalGetCurrentGlobalStylesId();
	}, [] );

	useEffect( () => {
		if ( ! globalStylesId ) {
			return;
		}
		async function installThemeAndVariation() {
			setIsLoading( true );
			await apiFetch( {
				path:
					'/wp-block-editor/v2/themes-directory-saving?theme_slug=' +
					theme,
				method: 'POST',
			} );
			await saveEntityRecord( 'root', 'globalStyles', {
				id: globalStylesId,
				styles: variation.styles,
				settings: variation.settings,
			} );
			setIsLoading( false );
		}
		installThemeAndVariation();
	}, [ globalStylesId, theme, variation, saveEntityRecord ] );

	if ( isLoading ) {
		return <div>Launching...</div>;
	}
	return (
		<div>
			<h1>Site installed properly.</h1>
			<p>Theme: { theme }</p>
			<p>Category: { category }</p>
			<p>Variation: { variation?.title }</p>
			<Button variant="primary" href="site-editor.php">
				Customize your site
			</Button>
		</div>
	);
}
