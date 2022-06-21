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
import ScreenElementColor from './screen-element-color';
import ScreenTypography from './screen-typography';
import ScreenTypographyElement from './screen-typography-element';
import ScreenColors from './screen-colors';
import ScreenColorPalette from './screen-color-palette';
import ScreenBackgroundColor from './screen-background-color';
import ScreenLayout from './screen-layout';
import ScreenStyleVariations from './screen-style-variations';
import { elementsWithTypography, elementsWithColors } from './elements';

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

			{ elementsWithTypography.map( ( element ) => (
				<GlobalStylesNavigationScreen
					key={ element.name }
					path={ parentMenu + '/typography/' + element.name }
				>
					<ScreenTypographyElement
						name={ name }
						element={ element.name }
					/>
				</GlobalStylesNavigationScreen>
			) ) }

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

			{ elementsWithColors.map( ( element ) => {
				const Component =
					element.colors.component || ScreenElementColor;
				return (
					<GlobalStylesNavigationScreen
						key={ element.name }
						path={ parentMenu + '/colors/' + element.name }
					>
						<Component
							name={ name }
							title={ element.colors.title }
							description={ element.colors.description }
						/>
					</GlobalStylesNavigationScreen>
				);
			} ) }

			<GlobalStylesNavigationScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } />
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
