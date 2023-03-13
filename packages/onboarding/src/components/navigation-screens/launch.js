/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';

export default function Launch( { theme, category, variation } ) {
	const [ isLoading, setIsLoading ] = useState( true );

	useEffect( () => {
		async function installThemeAndVariation() {
			setIsLoading( true );
			await apiFetch( {
				path:
					'/wp-block-editor/v2/themes-directory-saving?theme_slug=' +
					theme,
				method: 'POST',
			} );
			setIsLoading( false );
		}
		installThemeAndVariation();
	}, [ theme, variation ] );

	if ( isLoading ) {
		return <p>Loading...</p>;
	}
	return (
		<div>
			<h1>Site installed properly.</h1>
			<p>Theme: { theme }</p>
			<p>Category: { category }</p>
			<p>Variation: { variation?.title }</p>
			<Button variant="primary" href="/site-editor.php">
				Customize your site
			</Button>
		</div>
	);
}
