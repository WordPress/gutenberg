/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	FlexItem,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import { unlock } from '../../lock-unlock';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );

const EMPTY_COLORS = [];

function Palette( { name } ) {
	const [ customColors ] = useGlobalSetting( 'color.palette.custom' );
	const [ themeColors ] = useGlobalSetting( 'color.palette.theme' );
	const [ defaultColors ] = useGlobalSetting( 'color.palette.default' );

	const [ defaultPaletteEnabled ] = useGlobalSetting(
		'color.defaultPalette',
		name
	);

	const colors = useMemo(
		() => [
			...( customColors || EMPTY_COLORS ),
			...( themeColors || EMPTY_COLORS ),
			...( defaultColors && defaultPaletteEnabled
				? defaultColors
				: EMPTY_COLORS ),
		],
		[ customColors, themeColors, defaultColors, defaultPaletteEnabled ]
	);

	const hasColors = colors.length > 0;

	const screenPath = ! name
		? '/colors/palette'
		: '/blocks/' + encodeURIComponent( name ) + '/colors/palette';
	const paletteButtonText = hasColors
		? __( 'Edit palette' )
		: __( 'Add colors' );

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Palette' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path={ screenPath }>
					<HStack direction="row">
						<FlexItem>{ paletteButtonText }</FlexItem>
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</HStack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</VStack>
	);
}

export default Palette;
