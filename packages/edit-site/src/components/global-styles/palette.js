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
import { __, _n, sprintf } from '@wordpress/i18n';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Subtitle from './subtitle';
import { NavigationButton } from './navigation-button';
import { useSetting } from './hooks';

const EMPTY_COLORS = [];

function Palette( { name } ) {
	const [ customColors ] = useSetting( 'color.palette.custom' );
	const [ themeColors ] = useSetting( 'color.palette.theme' );
	const [ defaultColors ] = useSetting( 'color.palette.default' );

	const [ defaultPaletteEnabled ] = useSetting(
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

	const screenPath = ! name
		? '/colors/palette'
		: '/blocks/' + name + '/colors/palette';
	const paletteButtonText =
		colors.length > 0
			? sprintf(
					// Translators: %d: Number of palette colors.
					_n( '%d color', '%d colors', colors.length ),
					colors.length
			  )
			: __( 'Add custom colors' );

	return (
		<VStack spacing={ 3 }>
			<Subtitle>{ __( 'Palette' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButton path={ screenPath }>
					<HStack
						direction={
							colors.length === 0 ? 'row-reverse' : 'row'
						}
					>
						<ZStack
							isLayered={ false }
							offset={ -8 }
							// TODO:
							// - move to SCSS code + classname
							// - consider using grid scss variables
							// - consider adding a size prop to `ColorIndicator` ?
							style={ { marginTop: '2px', marginBottom: '2px' } }
						>
							{ colors.slice( 0, 5 ).map( ( { color } ) => (
								<ColorIndicator
									key={ color }
									colorValue={ color }
								/>
							) ) }
						</ZStack>
						<FlexItem>{ paletteButtonText }</FlexItem>
					</HStack>
				</NavigationButton>
			</ItemGroup>
		</VStack>
	);
}

export default Palette;
