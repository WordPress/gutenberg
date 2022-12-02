/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ScreenRoot from './screen-root';
import ScreenBlockList from './screen-block-list';
import ScreenBlock from './screen-block';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenBackgroundColor from './screen-background-color';
import ScreenTextColor from './screen-text-color';
import ScreenLinkColor from './screen-link-color';
import ScreenHeadingColor from './screen-heading-color';
import ScreenButtonColor from './screen-button-color';
import ScreenLayout from './screen-layout';
import ScreenTypography from './screen-typography';
import ScreenTypographyElement from './screen-typography-element';
import ScreenStyleVariations from './screen-style-variations';
import ScreenAddFontFamily from './screen-add-font-family';
import ScreenGoogleFontFacesList from './screen-google-font-faces';
import ScreenThemeFontFamilies from './screen-theme-font-families';
import ScreenThemeFontFacesList from './screen-theme-font-faces';

function GlobalStylesNavigationScreen( { className, ...props } ) {
	return (
		<NavigatorScreen
			className={ [
				'edit-site-global-styles-sidebar__navigator-screen',
				className,
			]
				.filter( Boolean )
				.join( ' ' ) }
			{ ...props }
		/>
	);
}

function ContextScreens( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<GlobalStylesNavigationScreen path={ parentMenu + '/typography' }>
				<ScreenTypography name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/text' }
			>
				<ScreenTypographyElement name={ name } element="text" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/link' }
			>
				<ScreenTypographyElement name={ name } element="link" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/heading' }
			>
				<ScreenTypographyElement name={ name } element="heading" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/typography/button' }
			>
				<ScreenTypographyElement name={ name } element="button" />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors' }>
				<ScreenColors name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/palette' }
			>
				<ScreenColorPalette name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/background' }
			>
				<ScreenBackgroundColor name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors/text' }>
				<ScreenTextColor name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors/link' }>
				<ScreenLinkColor name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/heading' }
			>
				<ScreenHeadingColor name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/button' }
			>
				<ScreenButtonColor name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } />
			</GlobalStylesNavigationScreen>
		</>
	);
}

function FontFamilyScreens() {
	const [ googleFontSelected, setGoogleFontSelected ] = useState( null );
	const [ themeFontSelected, setThemeFontSelected ] = useState( null );

	return (
		<>
			<GlobalStylesNavigationScreen path={ '/typography/font-families/' }>
				<ScreenAddFontFamily
					setGoogleFontSelected={ setGoogleFontSelected }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ '/typography/font-families/theme' }
			>
				<ScreenThemeFontFamilies
					setThemeFontSelected={ setThemeFontSelected }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ '/typography/font-families/theme-font-faces' }
			>
				<ScreenThemeFontFacesList
					themeFontSelected={ themeFontSelected }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ '/typography/font-families/google-font-faces' }
			>
				<ScreenGoogleFontFacesList
					googleFontSelected={ googleFontSelected }
				/>
			</GlobalStylesNavigationScreen>
		</>
	);
}

function GlobalStylesUI() {
	const blocks = getBlockTypes();

	return (
		<NavigatorProvider
			className="edit-site-global-styles-sidebar__navigator-provider"
			initialPath="/"
		>
			<GlobalStylesNavigationScreen path="/">
				<ScreenRoot />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/variations">
				<ScreenStyleVariations />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path="/blocks">
				<ScreenBlockList />
			</GlobalStylesNavigationScreen>

			{ blocks.map( ( block ) => (
				<GlobalStylesNavigationScreen
					key={ 'menu-block-' + block.name }
					path={ '/blocks/' + block.name }
				>
					<ScreenBlock name={ block.name } />
				</GlobalStylesNavigationScreen>
			) ) }

			<ContextScreens />
			<FontFamilyScreens />

			{ blocks.map( ( block ) => (
				<ContextScreens
					key={ 'screens-block-' + block.name }
					name={ block.name }
				/>
			) ) }
		</NavigatorProvider>
	);
}

export default GlobalStylesUI;
