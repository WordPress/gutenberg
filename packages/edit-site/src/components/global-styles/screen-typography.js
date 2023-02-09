/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalVStack as VStack,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { NavigationButtonAsItem } from './navigation-button';
import Subtitle from './subtitle';
import TypographyPanel from './typography-panel';
import BlockPreviewPanel from './block-preview-panel';
import { getVariationClassName } from './utils';
import { unlock } from '../../experiments';

const { useGlobalStyle } = unlock( blockEditorExperiments );

function Item( { name, parentMenu, element, label } ) {
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
						<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
						<ItemGroup isBordered isSeparated>
							<Item
								name={ name }
								parentMenu={ parentMenu }
								element="text"
								label={ __( 'Text' ) }
							/>
							<Item
								name={ name }
								parentMenu={ parentMenu }
								element="link"
								label={ __( 'Links' ) }
							/>
							<Item
								name={ name }
								parentMenu={ parentMenu }
								element="heading"
								label={ __( 'Headings' ) }
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
