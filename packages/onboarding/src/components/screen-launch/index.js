/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button, __experimentalHStack as HStack } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { addQueryArgs } from '@wordpress/url';

export default function ScreenLaunch( { theme, category, variation } ) {
	const [ isLoading, setIsLoading ] = useState( true );
	const { saveEntityRecord } = useDispatch( coreStore );
	const { globalStylesId, url } = useSelect( ( select ) => {
		const { __experimentalGetCurrentGlobalStylesId, getSite } =
			select( coreStore );
		return {
			globalStylesId: __experimentalGetCurrentGlobalStylesId(),
			url: getSite()?.url,
		};
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
			<HStack alignment="left">
				<Button
					variant="primary"
					href={ addQueryArgs( '/wp-admin/site-editor.php', {
						onboarding_complete: true,
					} ) }
				>
					Customize your site
				</Button>

				<Button variant="secondary" href={ url }>
					View your site
				</Button>
			</HStack>
		</div>
	);
}
