/**
 * WordPress dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
	Button,
} from '@wordpress/components';
import { Icon, check } from '@wordpress/icons';

export function ThemePicker( { category, theme: activeThemeSlug, setTheme } ) {
	const [ themes, setThemes ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	useEffect( () => {
		setIsLoading( true );
		window
			.fetch(
				`https://api.wordpress.org/themes/info/1.1/?action=query_themes&request[tag]=full-site-editing,${ category }&request[browse]=popular&request[per_page]=300`
			)
			.then( ( response ) => response.json() )
			.then( ( response ) => {
				setThemes( response.themes );
				setIsLoading( false );
			} );
	}, [ category ] );

	return (
		<>
			{ isLoading && <p>{ __( 'Loading…' ) }</p> }
			{ ! isLoading && (
				<Grid columns={ 3 } gap={ 5 }>
					{ themes.map( ( theme ) => (
						<Button
							key={ theme.slug }
							className="onboarding-theme-picker__item"
							onClick={ () => setTheme( theme.slug ) }
						>
							{ activeThemeSlug === theme.slug && (
								<div className="onboarding-theme-picker__item-indicator">
									<Icon icon={ check } />
								</div>
							) }
							<VStack>
								<img
									src={ theme.screenshot_url }
									alt={ theme.name }
									className="onboarding-theme-picker__item-img"
								/>
								<div className="onboarding-theme-picker__item-title">
									{ theme.name }
								</div>
							</VStack>
						</Button>
					) ) }
				</Grid>
			) }
		</>
	);
}
