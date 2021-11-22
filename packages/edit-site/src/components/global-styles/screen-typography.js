/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import NavigationButton from './navigation-button';
import { useStyle } from './hooks';
import Subtitle from './subtitle';
import TypographyPanel from './typography-panel';

function TextItem( { name, parentMenu } ) {
	const [ fontFamily ] = useStyle( 'typography.fontFamily', name );
	const [ fontSize ] = useStyle( 'typography.fontSize', name );
	const [ fontStyle ] = useStyle( 'typography.fontStyle', name );
	const [ fontWeight ] = useStyle( 'typography.fontWeight', name );
	const [ letterSpacing ] = useStyle( 'typography.letterSpacing', name );

	return (
		<NavigationButton path={ parentMenu + '/typography/text' }>
			<HStack justify="flex-start">
				<FlexItem
					className="edit-site-global-styles-screen-typography__indicator"
					style={ {
						fontFamily,
						fontSize,
						fontStyle,
						fontWeight,
						letterSpacing,
					} }
				>
					{ __( 'Aa' ) }
				</FlexItem>
				<FlexItem>{ __( 'Text' ) }</FlexItem>
			</HStack>
		</NavigationButton>
	);
}

function LinkItem( { name, parentMenu } ) {
	const hasSupport = ! name;
	const [ fontFamily ] = useStyle(
		'elements.link.typography.fontFamily',
		name
	);
	const [ fontSize ] = useStyle( 'elements.link.typography.fontSize', name );
	const [ fontStyle ] = useStyle(
		'elements.link.typography.fontStyle',
		name
	);
	const [ fontWeight ] = useStyle(
		'elements.link.typography.fontWeight',
		name
	);
	const [ letterSpacing ] = useStyle(
		'elements.link.typography.letterSpacing',
		name
	);

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButton path={ parentMenu + '/typography/link' }>
			<HStack justify="flex-start">
				<FlexItem
					className="edit-site-global-styles-screen-typography__indicator"
					style={ {
						fontFamily,
						fontSize,
						fontStyle,
						fontWeight,
						letterSpacing,
					} }
				>
					{ __( 'Aa' ) }
				</FlexItem>
				<FlexItem>{ __( 'Link' ) }</FlexItem>
			</HStack>
		</NavigationButton>
	);
}

function ScreenTypography( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
				back={ parentMenu ? parentMenu : '/' }
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>

			{ ! name && (
				<div className="edit-site-global-styles-screen-typography">
					<VStack spacing={ 3 }>
						<Subtitle>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<TextItem name={ name } parentMenu={ parentMenu } />
							<LinkItem name={ name } parentMenu={ parentMenu } />
						</ItemGroup>
					</VStack>
				</div>
			) }

			{ /* no typogrpahy elements support yet for blocks */ }
			{ !! name && <TypographyPanel name={ name } element="text" /> }
		</>
	);
}

export default ScreenTypography;
