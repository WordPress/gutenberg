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
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import type { Color } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { Subtitle } from './subtitle';
import { NavigationButtonAsItem } from './navigation-button';
import ColorIndicatorWrapper from './color-indicator-wrapper';
import { useSetting } from './hooks';

const EMPTY_COLORS: Color[] = [];

interface PaletteProps {
	name?: string;
}

function Palette( { name }: PaletteProps ) {
	const [ customColors ] = useSetting< Color[] >( 'color.palette.custom' );
	const [ themeColors ] = useSetting< Color[] >( 'color.palette.theme' );
	const [ defaultColors ] = useSetting< Color[] >( 'color.palette.default' );
	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultPalette',
		name
	);

	const safeCustomColors = customColors || EMPTY_COLORS;
	const safeThemeColors = themeColors || EMPTY_COLORS;
	const safeDefaultColors = defaultColors || EMPTY_COLORS;
	const safeDefaultPaletteEnabled = defaultPaletteEnabled ?? true;

	const colors = useMemo(
		() => [
			...safeCustomColors,
			...safeThemeColors,
			...( safeDefaultColors && safeDefaultPaletteEnabled
				? safeDefaultColors
				: EMPTY_COLORS ),
		],
		[
			safeCustomColors,
			safeThemeColors,
			safeDefaultColors,
			safeDefaultPaletteEnabled,
		]
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
		</VStack>
	);
}

export default Palette;
