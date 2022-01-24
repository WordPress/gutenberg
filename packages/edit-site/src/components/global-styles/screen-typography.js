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
import { NavigationButton } from './navigation-button';
import { useStyle } from './hooks';
import Subtitle from './subtitle';
import TypographyPanel from './typography-panel';

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
	const [ fontFamily ] = useStyle( prefix + 'typography.fontFamily', name );
	const [ fontStyle ] = useStyle( prefix + 'typography.fontStyle', name );
	const [ fontWeight ] = useStyle( prefix + 'typography.fontWeight', name );
	const [ letterSpacing ] = useStyle(
		prefix + 'typography.letterSpacing',
		name
	);
	const [ backgroundColor ] = useStyle( prefix + 'color.background', name );
	const [ gradientValue ] = useStyle( prefix + 'color.gradient', name );
	const [ color ] = useStyle( prefix + 'color.text', name );

	if ( ! hasSupport ) {
		return null;
	}

	return (
		<NavigationButton path={ parentMenu + '/typography/' + element }>
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
		</NavigationButton>
	);
}

function ScreenTypography( { name } ) {
	const parentMenu = name === undefined ? '' : '/blocks/' + name;

	return (
		<>
			<ScreenHeader
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
						</ItemGroup>
					</VStack>
				</div>
			) }

			{ /* no typography elements support yet for blocks */ }
			{ !! name && <TypographyPanel name={ name } element="text" /> }
		</>
	);
}

export default ScreenTypography;
