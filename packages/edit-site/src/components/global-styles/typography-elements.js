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
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { NavigationButtonAsItem } from './navigation-button';
import Subtitle from './subtitle';

import { unlock } from '../../lock-unlock';
const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function ElementItem( { parentMenu, element, label } ) {
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
	const [ backgroundColor ] = useGlobalStyle( prefix + 'color.background' );
	const [ fallbackBackgroundColor ] = useGlobalStyle( 'color.background' );
	const [ gradientValue ] = useGlobalStyle( prefix + 'color.gradient' );
	const [ color ] = useGlobalStyle( prefix + 'color.text' );

	return (
		<NavigationButtonAsItem path={ parentMenu + '/typography/' + element }>
			<HStack justify="flex-start">
				<FlexItem
					className="edit-site-global-styles-screen-typography__indicator"
					style={ {
						fontFamily: fontFamily ?? 'serif',
						background:
							gradientValue ??
							backgroundColor ??
							fallbackBackgroundColor,
						color,
						fontStyle,
						fontWeight,
						...extraStyles,
					} }
					aria-hidden="true"
				>
					{ __( 'Aa' ) }
				</FlexItem>
				<FlexItem>{ label }</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}

function TypographyElements() {
	const parentMenu = '';

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Elements' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<ElementItem
					parentMenu={ parentMenu }
					element="text"
					label={ __( 'Text' ) }
				/>
				<ElementItem
					parentMenu={ parentMenu }
					element="link"
					label={ __( 'Links' ) }
				/>
				<ElementItem
					parentMenu={ parentMenu }
					element="heading"
					label={ __( 'Headings' ) }
				/>
				<ElementItem
					parentMenu={ parentMenu }
					element="caption"
					label={ __( 'Captions' ) }
				/>
				<ElementItem
					parentMenu={ parentMenu }
					element="button"
					label={ __( 'Buttons' ) }
				/>
			</ItemGroup>
		</VStack>
	);
}

export default TypographyElements;
