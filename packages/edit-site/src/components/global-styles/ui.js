/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';
import { getBlockTypes } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import ScreenRoot from './screen-root';
import ScreenBlockList from './screen-block-list';
import ScreenBlock from './screen-block';
import ScreenTypography from './screen-typography';
import ScreenTypographyElement from './screen-typography-element';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenBackgroundColor from './screen-background-color';
import ScreenTextColor from './screen-text-color';
import ScreenLinkColor from './screen-link-color';
import ScreenLayout from './screen-layout';

function ContextScreens( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<NavigatorScreen path={ parentMenu + '/typography' }>
				<ScreenTypography name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/typography/text' }>
				<ScreenTypographyElement name={ name } element="text" />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/typography/link' }>
				<ScreenTypographyElement name={ name } element="link" />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors' }>
				<ScreenColors name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors/palette' }>
				<ScreenColorPalette name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors/background' }>
				<ScreenBackgroundColor name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors/text' }>
				<ScreenTextColor name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors/link' }>
				<ScreenLinkColor name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } />
			</NavigatorScreen>
		</>
	);
}

function GlobalStylesUI() {
	const blocks = getBlockTypes();

	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<ScreenRoot />
			</NavigatorScreen>

			<NavigatorScreen path="/blocks">
				<ScreenBlockList />
			</NavigatorScreen>

			{ blocks.map( ( block ) => (
				<NavigatorScreen
					key={ 'menu-block-' + block.name }
					path={ '/blocks/' + block.name }
				>
					<ScreenBlock name={ block.name } />
				</NavigatorScreen>
			) ) }

			<ContextScreens />

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
