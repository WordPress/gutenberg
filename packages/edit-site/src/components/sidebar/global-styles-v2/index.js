/**
 * WordPress dependencies
 */
import {
	CardHeader,
	__experimentalContextSystemProvider as ContextSystemProvider,
	__experimentalHeading as Heading,
	Navigator,
	NavigatorScreen,
	NavigatorScreens,
	__experimentalView as View,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	ColorPickerModal,
	Inspector,
	URLSync,
	useInitialPath,
} from './components';
import { ANIMATION_SPEED } from './constants';
import {
	ColorsElementScreen,
	ColorsPaletteScreen,
	ColorsScreen,
	GlobalStylesScreen,
	TypographyElementScreen,
	TypographyScreen,
} from './screens';
import { AppProvider } from './state';

/**
 * These are the "routes" that bind navigation paths with components for the
 * indivudal screens.
 */
const screens = [
	{
		component: GlobalStylesScreen,
		path: '/',
		title: 'Global Styles',
	},
	{
		component: ColorsScreen,
		path: '/colors',
		title: 'Colors',
	},
	{
		component: ColorsPaletteScreen,
		path: '/colors/palette',
		title: 'Palette',
	},
	{
		component: ColorsElementScreen,
		path: '/colors/elements/:id',
		title: 'Color Element',
	},
	{
		component: TypographyScreen,
		path: '/typography',
		title: 'Typography',
	},
	{
		component: TypographyElementScreen,
		path: '/typography/elements/:id',
		title: 'Typography Element',
	},
];

/**
 * GlobalStylesHeaer and Sidebar can largely be ignored.
 * These components exist to scaffold/bootstrap the Global Styles Sidebar
 * app into a simluated Gutenberg UI environment.
 */

const GlobalStylesHeader = () => {
	return (
		<CardHeader>
			<Heading size={ 5 }>Global Styles</Heading>
		</CardHeader>
	);
};

const Sidebar = ( { children } ) => {
	return (
		<ContextSystemProvider
			value={ {
				Grid: { gap: 2 },
				Icon: { size: 16 },
			} }
		>
			<View
				style={ {
					width: '280px',
					position: 'absolute',
					height: '100vh',
					top: 0,
					right: 0,
					/* @TODO: Update this to properly reflect the colorDivider color */
					borderLeft: '1px solid #444',
				} }
			>
				{ children }
			</View>
		</ContextSystemProvider>
	);
};

/**
 * Used for development purposes only.
 */
const DevOnlyComponents = () => {
	return (
		<>
			<Inspector />
			<URLSync />
		</>
	);
};

/**
 * This is the main GlobalStylesSidebar app.
 *
 * The "AppProvider" is for prototyping purposes only.
 * It's designed to simulate the data flow from WP data.
 *
 * The components to pay attention to would be the setup/relationship
 * between the NavigatorScreens, NavigatorScree, and routes.
 */
const App = () => {
	/**
	 * Gets the (potential) initial path from the browser URL.
	 */
	const initialPath = useInitialPath();

	return (
		<AppProvider>
			<ColorPickerModal />
			<Navigator initialPath={ initialPath }>
				<DevOnlyComponents />
				<GlobalStylesHeader />
				<View
					style={ {
						overflowY: 'auto',
						height: 'calc(100vh - 50px)',
					} }
				>
					<View>
						<NavigatorScreens
							style={ {
								height: 'auto',
								maxHeight: '100%',
							} }
						>
							{ screens.map( ( screen ) => (
								<NavigatorScreen
									{ ...screen }
									animationEnterDelay={ 0 }
									animationEnterDuration={ ANIMATION_SPEED }
									animationExitDuration={ ANIMATION_SPEED }
									exact
									key={ screen.path }
								/>
							) ) }
						</NavigatorScreens>
					</View>
				</View>
			</Navigator>
		</AppProvider>
	);
};

/**
 * Mounting for Storybook.
 */

export default () => {
	return (
		<Sidebar>
			<App />
		</Sidebar>
	);
};
