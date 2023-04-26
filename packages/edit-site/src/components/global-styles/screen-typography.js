/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalItem as Item,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	__experimentalText as Text,
	__experimentalUseNavigator as useNavigator,
	FlexItem,
	Dropdown,
	Icon,
	MenuGroup,
	MenuItem,
	Button,
} from '@wordpress/components';
import { moreVertical } from '@wordpress/icons';
import { useState } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { NavigationButtonAsItem } from './navigation-button';
import { useStyle, useFontFamilies } from './hooks';
import Subtitle from './subtitle';
import TypographyPanel from './typography-panel';
import FontUploadModal from './font-upload-modal';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../private-apis';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function FontFamilies() {
	const { goTo } = useNavigator();
	const { count } = useFontFamilies();

	return (
		<ItemGroup isBordered isSeparated>
			{ count > 0 && (
				<Item
					onClick={ () => {
						goTo( '/typography/font-families/theme' );
					} }
				>
					<HStack justify="space-between">
						<FlexItem>
							<Text>{ __( 'Aa' ) }</Text>
						</FlexItem>
						<FlexItem>{ count + __( ' Font Families' ) }</FlexItem>
					</HStack>
				</Item>
			) }
			{ ! count && (
				<Item
					onClick={ () => {
						goTo( '/typography/font-families/' );
					} }
				>
					<HStack justify="space-between">
						<FlexItem>
							<Text>{ __( '+' ) }</Text>
						</FlexItem>
						<FlexItem>{ __( 'Add Google Fonts' ) }</FlexItem>
					</HStack>
				</Item>
			) }
		</ItemGroup>
	);
}

function ElementItem( { name, parentMenu, element, label } ) {
	const hasSupport = ! name;
	const prefix =
		element === 'text' || ! element ? '' : `elements.${ element }.`;
	const extraStyles =
		element === 'link'
			? {
					textDecoration: 'underline',
			  }
			: {};
	const [ fontFamily ] = useGlobalStyle(
		prefix + 'typography.fontFamily',
		name
	);
	const [ fontStyle ] = useGlobalStyle(
		prefix + 'typography.fontStyle',
		name
	);
	const [ fontWeight ] = useGlobalStyle(
		prefix + 'typography.fontWeight',
		name
	);
	const [ letterSpacing ] = useGlobalStyle(
		prefix + 'typography.letterSpacing',
		name
	);
	const [ backgroundColor ] = useGlobalStyle(
		prefix + 'color.background',
		name
	);
	const [ gradientValue ] = useGlobalStyle( prefix + 'color.gradient', name );
	const [ color ] = useGlobalStyle( prefix + 'color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	const navigationButtonLabel = sprintf(
		// translators: %s: is a subset of Typography, e.g., 'text' or 'links'.
		__( 'Typography %s styles' ),
		label
	);

	return (
		<NavigationButtonAsItem
			path={ parentMenu + '/typography/' + element }
			aria-label={ navigationButtonLabel }
		>
			<HStack justify="flex-start">
				<FlexItem
					className="edit-site-global-styles-screen-typography__indicator"
					style={ {
						fontFamily: fontFamily ?? 'serif',
						background: gradientValue ?? backgroundColor,
						color,
						fontStyle,
						fontWeight,
						letterSpacing,
						...extraStyles,
					} }
				>
					{ __( 'Aa' ) }
				</FlexItem>
				<FlexItem>{ label }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function FontFamiliesMenu() {
	const { goTo } = useNavigator();
	const [ isModalLocalFontOpen, setIsModalLocalFontOpen ] = useState( false );
	const toggleModalLocalFontOpen = () => {
		setIsModalLocalFontOpen( ! isModalLocalFontOpen );
	};
	return (
		<>
			{ isModalLocalFontOpen && (
				<FontUploadModal
					toggleModalLocalFontOpen={ toggleModalLocalFontOpen }
				/>
			) }

			<MenuGroup label={ __( 'Font Families' ) }>
				<MenuItem
					onClick={ () => {
						goTo( '/typography/font-families/' );
					} }
				>
					<Text>{ __( 'Add Google Fonts' ) }</Text>
				</MenuItem>
				<MenuItem onClick={ toggleModalLocalFontOpen }>
					<Text>{ __( 'Upload Local Font' ) }</Text>
				</MenuItem>
			</MenuGroup>
		</>
	);
}

function FontFamiliesDropdown() {
	return (
		<Dropdown
			renderContent={ () => <FontFamiliesMenu /> }
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button onClick={ onToggle } aria-expanded={ isOpen }>
					<Icon icon={ moreVertical } />
				</Button>
			) }
		/>
	);
}

function ScreenTypography( { name, variation = '' } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;
	const variationClassName = getVariationClassName( variation );
	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>

			<BlockPreviewPanel name={ name } variation={ variationClassName } />

			{ ! name && (
				<div className="edit-site-global-styles-screen-typography">
					<VStack spacing={ 3 }>
						<HStack>
							<Subtitle>{ __( 'Font Families' ) }</Subtitle>
							<FontFamiliesDropdown />
						</HStack>

						<FontFamilies />

						<Subtitle>{ __( 'Elements' ) }</Subtitle>
						<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<ElementItem
								name={ name }
								parentMenu={ parentMenu }
								element="text"
								label={ __( 'Text' ) }
							/>
							<ElementItem
								name={ name }
								parentMenu={ parentMenu }
								element="link"
								label={ __( 'Links' ) }
							/>
							<ElementItem
								name={ name }
								parentMenu={ parentMenu }
								element="heading"
								label={ __( 'Headings' ) }
							/>
							<ElementItem
								name={ name }
								parentMenu={ parentMenu }
								element="caption"
								label={ __( 'Captions' ) }
							/>
							<Item
								name={ name }
								parentMenu={ parentMenu }
								element="button"
								label={ __( 'Buttons' ) }
							/>
						</ItemGroup>
					</VStack>
				</div>
			) }

			{ /* No typography elements support yet for blocks. */ }
			{ !! name && (
				<TypographyPanel
					name={ name }
					variation={ variation }
					element="text"
				/>
			) }
		</>
	);
}

export default ScreenTypography;
