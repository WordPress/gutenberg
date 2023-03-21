/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalZStack as ZStack,
	FlexItem,
	ColorIndicator,
} from '@wordpress/components';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Palette from './palette';
import { NavigationButtonAsItem } from './navigation-button';
import { getSupportedGlobalStylesPanels } from './hooks';
import Subtitle from './subtitle';
import ColorIndicatorWrapper from './color-indicator-wrapper';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassNameFromPath } from './utils';
import { unlock } from '../../experiments';

const { useGlobalStyle } = unlock( blockEditorExperiments );

function variationPathToURL( variationPath ) {
	if ( ! variationPath ) {
		return '';
	}
	// Replace the dots with slashes, add slash at the beginning and remove the last slash.
	return '/' + variationPath.replace( /\./g, '/' ).slice( 0, -1 );
}

function BackgroundColorItem( { name, parentMenu, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport =
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' );
	const [ backgroundColor ] = useGlobalStyle(
		variationPath + 'color.background',
		name
	);
	const [ gradientValue ] = useGlobalStyle(
		variationPath + 'color.gradient',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={
				parentMenu +
				variationPathToURL( variationPath ) +
				'/colors/background'
			}
			aria-label={ __( 'Colors background styles' ) }
		>
			<HStack justify="flex-start">
				<ColorIndicatorWrapper expanded={ false }>
					<ColorIndicator
						colorValue={ gradientValue ?? backgroundColor }
						data-testid="background-color-indicator"
					/>
				</ColorIndicatorWrapper>
				<FlexItem className="edit-site-global-styles__color-label">
					{ __( 'Background' ) }
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function TextColorItem( { name, parentMenu, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useGlobalStyle( variationPath + 'color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={
				parentMenu +
				variationPathToURL( variationPath ) +
				'/colors/text'
			}
			aria-label={ __( 'Colors text styles' ) }
		>
			<HStack justify="flex-start">
				<ColorIndicatorWrapper expanded={ false }>
					<ColorIndicator
						colorValue={ color }
						data-testid="text-color-indicator"
					/>
				</ColorIndicatorWrapper>
				<FlexItem className="edit-site-global-styles__color-label">
					{ __( 'Text' ) }
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function LinkColorItem( { name, parentMenu, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'linkColor' );
	const [ color ] = useGlobalStyle(
		variationPath + 'elements.link.color.text',
		name
	);
	const [ colorHover ] = useGlobalStyle(
		variationPath + 'elements.link.:hover.color.text',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={
				parentMenu +
				variationPathToURL( variationPath ) +
				'/colors/link'
			}
			aria-label={ __( 'Colors link styles' ) }
		>
			<HStack justify="flex-start">
				<ZStack isLayered={ false } offset={ -8 }>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ color } />
					</ColorIndicatorWrapper>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ colorHover } />
					</ColorIndicatorWrapper>
				</ZStack>
				<FlexItem className="edit-site-global-styles__color-label">
					{ __( 'Links' ) }
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function HeadingColorItem( { name, parentMenu, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useGlobalStyle(
		variationPath + 'elements.heading.color.text',
		name
	);
	const [ bgColor ] = useGlobalStyle(
		variationPath + 'elements.heading.color.background',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={
				parentMenu +
				variationPathToURL( variationPath ) +
				'/colors/heading'
			}
			aria-label={ __( 'Colors heading styles' ) }
		>
			<HStack justify="flex-start">
				<ZStack isLayered={ false } offset={ -8 }>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ bgColor } />
					</ColorIndicatorWrapper>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ color } />
					</ColorIndicatorWrapper>
				</ZStack>
				<FlexItem>{ __( 'Headings' ) }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function ButtonColorItem( { name, parentMenu, variationPath = '' } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'buttonColor' );
	const [ color ] = useGlobalStyle(
		variationPath + 'elements.button.color.text',
		name
	);
	const [ bgColor ] = useGlobalStyle(
		variationPath + 'elements.button.color.background',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={
				parentMenu +
				variationPathToURL( variationPath ) +
				'/colors/button'
			}
		>
			<HStack justify="flex-start">
				<ZStack isLayered={ false } offset={ -8 }>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ bgColor } />
					</ColorIndicatorWrapper>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ color } />
					</ColorIndicatorWrapper>
				</ZStack>
				<FlexItem className="edit-site-global-styles__color-label">
					{ __( 'Buttons' ) }
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function ScreenColors( { name, variationPath = '' } ) {
	const parentMenu =
		name === undefined ? '' : '/blocks/' + encodeURIComponent( name );
	const variationClassName = getVariationClassNameFromPath( variationPath );

	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Manage palettes and the default color of different global elements on the site.'
				) }
			/>

			<BlockPreviewPanel name={ name } variation={ variationClassName } />

			<div className="edit-site-global-styles-screen-colors">
				<VStack spacing={ 10 }>
					<Palette name={ name } />

					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<BackgroundColorItem
								name={ name }
								parentMenu={ parentMenu }
								variationPath={ variationPath }
							/>
							<TextColorItem
								name={ name }
								parentMenu={ parentMenu }
								variationPath={ variationPath }
							/>
							<LinkColorItem
								name={ name }
								parentMenu={ parentMenu }
								variationPath={ variationPath }
							/>
							<HeadingColorItem
								name={ name }
								parentMenu={ parentMenu }
								variationPath={ variationPath }
							/>
							<ButtonColorItem
								name={ name }
								parentMenu={ parentMenu }
								variationPath={ variationPath }
							/>
						</ItemGroup>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
