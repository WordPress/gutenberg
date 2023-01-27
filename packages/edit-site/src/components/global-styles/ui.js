/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { getBlockTypes, store as blocksStore } from '@wordpress/blocks';

import { useSelect } from '@wordpress/data';

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
import ScreenHeadingColor from './screen-heading-color';
import ScreenButtonColor from './screen-button-color';
import ScreenLayout from './screen-layout';
import ScreenStyleVariations from './screen-style-variations';
import { ScreenVariation } from './screen-variations';
import ScreenBorder from './screen-border';
import StyleBook from '../style-book';
import ScreenCSS from './screen-css';

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

function BlockStyleVariationsScreens( { name } ) {
	const blockStyleVariations = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);
	if ( ! blockStyleVariations?.length ) {
		return null;
	}

	return blockStyleVariations.map( ( variation ) => (
		<ContextScreens
			key={ variation.name + name }
			name={ name }
			parentMenu={
				'/blocks/' +
				encodeURIComponent( name ) +
				'/variations/' +
				encodeURIComponent( variation.name )
			}
		/>
	) );
}

function BlockStylesNavigationScreens( {
	parentMenu,
	blockStyles,
	blockName,
} ) {
	return blockStyles.map( ( style, index ) => (
		<GlobalStylesNavigationScreen
			key={ index }
			path={ parentMenu + '/variations/' + style.name }
		>
			<ScreenVariation blockName={ blockName } style={ style } />
		</GlobalStylesNavigationScreen>
	) );
}

function ContextScreens( { name, parentMenu = '' } ) {
	const hasVariationPath = parentMenu.search( 'variations' );
	const variationPath =
		hasVariationPath !== -1
			? parentMenu
					.substring( hasVariationPath )
					.replace( '/', '.' )
					.concat( '', '.' )
			: '';
	const blockStyleVariations = useSelect(
		( select ) => {
			const { getBlockStyles } = select( blocksStore );
			return getBlockStyles( name );
		},
		[ name ]
	);

	return (
		<>
			<GlobalStylesNavigationScreen path={ parentMenu + '/typography' }>
				<ScreenTypography
					name={ name }
					variationPath={ variationPath }
				/>
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
				<ScreenColors name={ name } variationPath={ variationPath } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/palette' }
			>
				<ScreenColorPalette name={ name } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/background' }
			>
				<ScreenBackgroundColor
					name={ name }
					variationPath={ variationPath }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors/text' }>
				<ScreenTextColor
					name={ name }
					variationPath={ variationPath }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/colors/link' }>
				<ScreenLinkColor
					name={ name }
					variationPath={ variationPath }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/heading' }
			>
				<ScreenHeadingColor
					name={ name }
					variationPath={ variationPath }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen
				path={ parentMenu + '/colors/button' }
			>
				<ScreenButtonColor
					name={ name }
					variationPath={ variationPath }
				/>
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/border' }>
				<ScreenBorder name={ name } variationPath={ variationPath } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/layout' }>
				<ScreenLayout name={ name } variationPath={ variationPath } />
			</GlobalStylesNavigationScreen>

			<GlobalStylesNavigationScreen path={ parentMenu + '/css' }>
				<ScreenCSS name={ name } />
			</GlobalStylesNavigationScreen>

			{ !! blockStyleVariations?.length && (
				<BlockStylesNavigationScreens
					parentMenu={ parentMenu }
					blockStyles={ blockStyleVariations }
					blockName={ name }
				/>
			) }
		</>
	);
}

function GlobalStylesStyleBook( { onClose } ) {
	const navigator = useNavigator();
	const { path } = navigator.location;
	return (
		<StyleBook
			isSelected={ ( blockName ) =>
				// Match '/blocks/core%2Fbutton' and
				// '/blocks/core%2Fbutton/typography', but not
				// '/blocks/core%2Fbuttons'.
				path === `/blocks/${ encodeURIComponent( blockName ) }` ||
				path.startsWith(
					`/blocks/${ encodeURIComponent( blockName ) }/`
				)
			}
			onSelect={ ( blockName ) => {
				// Clear navigator history by going back to the root.
				const depth = path.match( /\//g ).length;
				for ( let i = 0; i < depth; i++ ) {
					navigator.goBack();
				}
				// Now go to the selected block.
				navigator.goTo( '/blocks/' + encodeURIComponent( blockName ) );
			} }
			onClose={ onClose }
		/>
	);
}

function GlobalStylesUI( { isStyleBookOpened, onCloseStyleBook } ) {
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
					path={ '/blocks/' + encodeURIComponent( block.name ) }
				>
					<ScreenBlock name={ block.name } />
				</GlobalStylesNavigationScreen>
			) ) }

			<ContextScreens />

			{ blocks.map( ( block ) => (
				<ContextScreens
					key={ 'screens-block-' + block.name }
					name={ block.name }
					parentMenu={ '/blocks/' + encodeURIComponent( block.name ) }
				/>
			) ) }

			{ blocks.map( ( block, index ) => {
				return (
					<BlockStyleVariationsScreens
						key={ 'screens-block-styles-' + block.name + index }
						name={ block.name }
					/>
				);
			} ) }
			{ isStyleBookOpened && (
				<GlobalStylesStyleBook onClose={ onCloseStyleBook } />
			) }
		</NavigatorProvider>
	);
}

export default GlobalStylesUI;
