/**
 * WordPress dependencies
 */
import {
	__experimentalItemGroup as ItemGroup,
	FlexItem,
	__experimentalHStack as HStack,
	__experimentalZStack as ZStack,
	__experimentalVStack as VStack,
	ColorIndicator,
	Button,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { Icon, shuffle, chevronLeft, chevronRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Subtitle from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import { useColorRandomizer } from './hooks';
import ColorIndicatorWrapper from './color-indicator-wrapper';
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

	const [ randomizeThemeColors ] = useColorRandomizer();

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

	const screenPath = ! name
		? '/colors/palette'
		: '/blocks/' + encodeURIComponent( name ) + '/colors/palette';

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Palette' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path={ screenPath }>
					<HStack direction="row">
						{ colors.length > 0 ? (
							<>
								<ZStack isLayered={ false } offset={ -8 }>
									{ colors
										.slice( 0, 5 )
										.map( ( { color }, index ) => (
											<ColorIndicatorWrapper
												key={ `${ color }-${ index }` }
											>
												<ColorIndicator
													colorValue={ color }
												/>
											</ColorIndicatorWrapper>
										) ) }
								</ZStack>
								<FlexItem isBlock>
									{ __( 'Edit palette' ) }
								</FlexItem>
							</>
						) : (
							<FlexItem>{ __( 'Add colors' ) }</FlexItem>
						) }
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</HStack>
				</NavigationButtonAsItem>
			</ItemGroup>
			{ window.__experimentalEnableColorRandomizer &&
				themeColors?.length > 0 && (
					<Button
						__next40pxDefaultSize
						variant="secondary"
						icon={ shuffle }
						onClick={ randomizeThemeColors }
					>
						{ __( 'Randomize colors' ) }
					</Button>
				) }
		</VStack>
	);
}

export default Palette;
