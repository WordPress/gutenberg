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
import { useSupportedStyles } from './hooks';
import Subtitle from './subtitle';
import ColorIndicatorWrapper from './color-indicator-wrapper';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../experiments';

const { useGlobalStyle } = unlock( blockEditorExperiments );

function BackgroundColorItem( { name, parentMenu, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport =
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' );
	const [ backgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name
	);
	const [ gradientValue ] = useGlobalStyle( prefix + 'color.gradient', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/colors/background' }
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

function TextColorItem( { name, parentMenu, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useGlobalStyle( prefix + 'color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/colors/text' }
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

function LinkColorItem( { name, parentMenu, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport = supports.includes( 'linkColor' );
	const [ color ] = useGlobalStyle(
		prefix + 'elements.link.color.text',
		name
	);
	const [ colorHover ] = useGlobalStyle(
		prefix + 'elements.link.:hover.color.text',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/colors/link' }
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

function HeadingColorItem( { name, parentMenu, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useGlobalStyle(
		prefix + 'elements.heading.color.text',
		name
	);
	const [ bgColor ] = useGlobalStyle(
		prefix + 'elements.heading.color.background',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/colors/heading' }
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

function ButtonColorItem( { name, parentMenu, variation = '' } ) {
	const prefix = variation ? `variations.${ variation }.` : '';
	const urlPrefix = variation ? `/variations/${ variation }` : '';
	const supports = useSupportedStyles( name );
	const hasSupport = supports.includes( 'buttonColor' );
	const [ color ] = useGlobalStyle(
		prefix + 'elements.button.color.text',
		name
	);
	const [ bgColor ] = useGlobalStyle(
		prefix + 'elements.button.color.background',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + urlPrefix + '/colors/button' }
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

function ScreenColors( { name, variation = '' } ) {
	const parentMenu =
		name === undefined ? '' : '/blocks/' + encodeURIComponent( name );
	const variationClassName = getVariationClassName( variation );

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
						<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<BackgroundColorItem
								name={ name }
								parentMenu={ parentMenu }
								variation={ variation }
							/>
							<TextColorItem
								name={ name }
								parentMenu={ parentMenu }
								variation={ variation }
							/>
							<LinkColorItem
								name={ name }
								parentMenu={ parentMenu }
								variation={ variation }
							/>
							<HeadingColorItem
								name={ name }
								parentMenu={ parentMenu }
								variation={ variation }
							/>
							<ButtonColorItem
								name={ name }
								parentMenu={ parentMenu }
								variation={ variation }
							/>
						</ItemGroup>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
