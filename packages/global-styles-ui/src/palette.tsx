import {
	__experimentalItemGroup as ItemGroup,
	ColorIndicator,
} from '@wordpress/components';
import { isRTL, __ } from '@wordpress/i18n';
import { Icon, chevronLeft, chevronRight } from '@wordpress/icons';
import { useMemo } from '@wordpress/element';
import type { Color } from '@wordpress/global-styles-engine';
import { Stack } from '@wordpress/ui';
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
		<Stack direction="column" gap="md">
			<Subtitle level={ 3 }>{ __( 'Palette' ) }</Subtitle>
			<ItemGroup isBordered isSeparated>
				<NavigationButtonAsItem path={ screenPath }>
					<Stack
						direction="row"
						justify="space-between"
						align="center"
					>
						{ colors.length > 0 ? (
							<Stack direction="row" align="center" gap="sm">
								<div className="global-styles-ui__palette-preview">
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
								</div>
								<span>{ __( 'Edit palette' ) }</span>
							</Stack>
						) : (
							<span>{ __( 'Add colors' ) }</span>
						) }
						<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
					</Stack>
				</NavigationButtonAsItem>
			</ItemGroup>
		</Stack>
	);
}

export default Palette;
