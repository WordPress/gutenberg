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

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Palette from './palette';
import { NavigationButtonAsItem } from './navigation-button';
import { getSupportedGlobalStylesPanels, useStyle } from './hooks';
import Subtitle from './subtitle';
import ColorIndicatorWrapper from './color-indicator-wrapper';

function BackgroundColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport =
		supports.includes( 'backgroundColor' ) ||
		supports.includes( 'background' );
	const [ backgroundColor ] = useStyle( 'color.background', name );
	const [ gradientValue ] = useStyle( 'color.gradient', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + '/colors/background' }
			aria-label={ __( 'Colors background styles' ) }
		>
			<HStack justify="flex-start">
				<ColorIndicatorWrapper expanded={ false }>
					<ColorIndicator
						colorValue={ gradientValue ?? backgroundColor }
						data-testid="background-color-indicator"
					/>
				</ColorIndicatorWrapper>
				<FlexItem>{ __( 'Background' ) }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function TextColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useStyle( 'color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + '/colors/text' }
			aria-label={ __( 'Colors text styles' ) }
		>
			<HStack justify="flex-start">
				<ColorIndicatorWrapper expanded={ false }>
					<ColorIndicator
						colorValue={ color }
						data-testid="text-color-indicator"
					/>
				</ColorIndicatorWrapper>
				<FlexItem>{ __( 'Text' ) }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function LinkColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'linkColor' );
	const [ color ] = useStyle( 'elements.link.color.text', name );
	const [ colorHover ] = useStyle( 'elements.link.:hover.color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + '/colors/link' }
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
				<FlexItem>{ __( 'Links' ) }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function HeadingColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'color' );
	const [ color ] = useStyle( 'elements.heading.color.text', name );
	const [ bgColor ] = useStyle( 'elements.heading.color.background', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem
			path={ parentMenu + '/colors/heading' }
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

function ButtonColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'buttonColor' );
	const [ color ] = useStyle( 'elements.button.color.text', name );
	const [ bgColor ] = useStyle( 'elements.button.color.background', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButtonAsItem path={ parentMenu + '/colors/button' }>
			<HStack justify="flex-start">
				<ZStack isLayered={ false } offset={ -8 }>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ bgColor } />
					</ColorIndicatorWrapper>
					<ColorIndicatorWrapper expanded={ false }>
						<ColorIndicator colorValue={ color } />
					</ColorIndicatorWrapper>
				</ZStack>
				<FlexItem>{ __( 'Buttons' ) }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function ScreenColors( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				title={ __( 'Colors' ) }
				description={ __(
					'Manage palettes and the default color of different global elements on the site.'
				) }
			/>

			<div className="edit-site-global-styles-screen-colors">
				<VStack spacing={ 10 }>
					<Palette name={ name } />

					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<BackgroundColorItem
								name={ name }
								parentMenu={ parentMenu }
							/>
							<TextColorItem
								name={ name }
								parentMenu={ parentMenu }
							/>
							<LinkColorItem
								name={ name }
								parentMenu={ parentMenu }
							/>
							<HeadingColorItem
								name={ name }
								parentMenu={ parentMenu }
							/>
							<ButtonColorItem
								name={ name }
								parentMenu={ parentMenu }
							/>
						</ItemGroup>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
