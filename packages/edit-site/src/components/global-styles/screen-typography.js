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
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import ScreenHeader from './header';
import { NavigationButtonAsItem } from './navigation-button';
import Subtitle from './subtitle';
import BlockPreviewPanel from './block-preview-panel';
import { unlock } from '../../lock-unlock';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function Item( { parentMenu, element, label } ) {
	const prefix =
		element === 'text' || ! element ? '' : `elements.${ element }.`;
	const extraStyles =
		element === 'link'
			? {
					textDecoration: 'underline',
			  }
			: {};
	const [ fontFamily ] = useGlobalStyle( prefix + 'typography.fontFamily' );
	const [ fontStyle ] = useGlobalStyle( prefix + 'typography.fontStyle' );
	const [ fontWeight ] = useGlobalStyle( prefix + 'typography.fontWeight' );
	const [ letterSpacing ] = useGlobalStyle(
		prefix + 'typography.letterSpacing'
	);
	const [ backgroundColor ] = useGlobalStyle( prefix + 'color.background' );
	const [ gradientValue ] = useGlobalStyle( prefix + 'color.gradient' );
	const [ color ] = useGlobalStyle( prefix + 'color.text' );

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

function ScreenTypography() {
	const parentMenu = '';

	return (
		<>
			<ScreenHeader
				title={ __( 'Typography' ) }
				description={ __(
					'Manage the typography settings for different elements.'
				) }
			/>

			<BlockPreviewPanel />

			<div className="edit-site-global-styles-screen-typography">
				<VStack spacing={ 3 }>
					<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
					<ItemGroup isBordered isSeparated>
						<Item
							parentMenu={ parentMenu }
							element="text"
							label={ __( 'Text' ) }
						/>
						<Item
							parentMenu={ parentMenu }
							element="link"
							label={ __( 'Links' ) }
						/>
						<Item
							parentMenu={ parentMenu }
							element="heading"
							label={ __( 'Headings' ) }
						/>
						<Item
							parentMenu={ parentMenu }
							element="caption"
							label={ __( 'Captions' ) }
						/>
						<Item
							parentMenu={ parentMenu }
							element="button"
							label={ __( 'Buttons' ) }
						/>
					</ItemGroup>
				</VStack>
			</div>
		</>
	);
}

export default ScreenTypography;
