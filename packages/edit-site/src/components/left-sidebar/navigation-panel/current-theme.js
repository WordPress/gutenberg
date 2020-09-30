/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import {
	__experimentalNavigationGroup as NavigationGroup,
	__experimentalNavigationItem as NavigationItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ThemePreview from './theme-preview';

export default function CurrentTheme() {
	const [ themePreviewVisible, setThemePreviewVisible ] = useState( false );

	const onMouseEnterTheme = () => setThemePreviewVisible( true );
	const onMouseLeaveTheme = () => setThemePreviewVisible( false );

	const currentTheme = useSelect(
		( select ) => select( 'core' ).getCurrentTheme(),
		[]
	);

	return (
		<>
			<NavigationGroup title={ __( 'Current theme' ) }>
				<NavigationItem
					onMouseEnter={ onMouseEnterTheme }
					onMouseLeave={ onMouseLeaveTheme }
					title={ currentTheme?.name?.raw || __( 'Loading…' ) }
				/>
			</NavigationGroup>

			{ currentTheme && themePreviewVisible && (
				<ThemePreview theme={ currentTheme } />
			) }
		</>
	);
}
