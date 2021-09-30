/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useGlobalStylesContext } from '../editor/global-styles-provider';
import ScreenRoot from './screen-root';
import ScreenBlockList from './screen-block-list';
import ScreenBlock from './screen-block';
import ScreenTypography from './screen-typography';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenLayout from './screen-layout';

function ContextScreens( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<NavigatorScreen path={ parentMenu + '/typography' }>
				<ScreenTypography name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors' }>
				<ScreenColors name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/colors/palette' }>
				<ScreenColorPalette name={ name } />
			</NavigatorScreen>

			<NavigatorScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } />
			</NavigatorScreen>
		</>
	);
}

function GlobalStyles() {
	const { blocks } = useGlobalStylesContext();

	return (
		<NavigatorProvider initialPath="/">
			<NavigatorScreen path="/">
				<ScreenRoot />
			</NavigatorScreen>

			<NavigatorScreen path="/blocks">
				<ScreenBlockList />
			</NavigatorScreen>

			{ map( blocks, ( block, name ) => (
				<NavigatorScreen
					key={ 'menu-block-' + name }
					path={ '/blocks/' + name }
				>
					<ScreenBlock name={ name } />
				</NavigatorScreen>
			) ) }

			<ContextScreens />

			{ map( blocks, ( _, name ) => (
				<ContextScreens key={ 'screens-block-' + name } name={ name } />
			) ) }
		</NavigatorProvider>
	);
}

export default GlobalStyles;
