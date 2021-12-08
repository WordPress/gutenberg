/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
	ColorIndicator,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import Palette from './palette';
import { NavigationButton } from './navigation-button';
import { getSupportedGlobalStylesPanels, useStyle } from './hooks';
import Subtitle from './subtitle';

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
		<NavigationButton path={ parentMenu + '/colors/background' }>
			<HStack justify="flex-start">
				<FlexItem>
					<ColorIndicator
						colorValue={ gradientValue ?? backgroundColor }
					/>
				</FlexItem>
				<FlexItem>{ __( 'Background' ) }</FlexItem>
			</HStack>
		</NavigationButton>
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
		<NavigationButton path={ parentMenu + '/colors/text' }>
			<HStack justify="flex-start">
				<FlexItem>
					<ColorIndicator colorValue={ color } />
				</FlexItem>
				<FlexItem>{ __( 'Text' ) }</FlexItem>
			</HStack>
		</NavigationButton>
	);
}

function LinkColorItem( { name, parentMenu } ) {
	const supports = getSupportedGlobalStylesPanels( name );
	const hasSupport = supports.includes( 'linkColor' );
	const [ color ] = useStyle( 'elements.link.color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButton path={ parentMenu + '/colors/link' }>
			<HStack justify="flex-start">
				<FlexItem>
					<ColorIndicator colorValue={ color } />
				</FlexItem>
				<FlexItem>{ __( 'Links' ) }</FlexItem>
			</HStack>
		</NavigationButton>
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
						</ItemGroup>
					</VStack>
				</VStack>
			</div>
		</>
	);
}

export default ScreenColors;
