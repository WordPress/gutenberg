/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
	__experimentalPaletteEdit as PaletteEdit,
	__experimentalSpacer as Spacer,
	DuotonePicker,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { Gradient } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { Subtitle } from './subtitle';
import { useSetting } from './hooks';

const mobilePopoverProps = { placement: 'bottom-start' as const, offset: 8 };

const noop = () => {};

interface GradientPalettePanelProps {
	name?: string;
}

export default function GradientPalettePanel( {
	name,
}: GradientPalettePanelProps ) {
	const [ themeGradients, setThemeGradients ] = useSetting< Gradient[] >(
		'color.gradients.theme',
		name
	);
	const [ baseThemeGradients ] = useSetting< Gradient[] >(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients ] = useSetting< Gradient[] >(
		'color.gradients.default',
		name
	);
	const [ baseDefaultGradients ] = useSetting< Gradient[] >(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients ] = useSetting< Gradient[] >(
		'color.gradients.custom',
		name
	);

	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultGradients',
		name
	);

	const [ customDuotone ] = useSetting( 'color.duotone.custom' ) || [];
	const [ defaultDuotone ] = useSetting( 'color.duotone.default' ) || [];
	const [ themeDuotone ] = useSetting( 'color.duotone.theme' ) || [];
	const [ defaultDuotoneEnabled ] = useSetting( 'color.defaultDuotone' );

	const duotonePalette = [
		...( customDuotone || [] ),
		...( themeDuotone || [] ),
		...( defaultDuotone && defaultDuotoneEnabled ? defaultDuotone : [] ),
	];

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	return (
		<VStack
			className="global-styles-ui-gradient-palette-panel"
			spacing={ 8 }
		>
			{ !! themeGradients && !! themeGradients.length && (
				<PaletteEdit
					canReset={ themeGradients !== baseThemeGradients }
					canOnlyChangeValues
					gradients={ themeGradients }
					onChange={ setThemeGradients }
					paletteLabel={ __( 'Theme' ) }
					paletteLabelHeadingLevel={ 3 }
					popoverProps={ popoverProps }
				/>
			) }
			{ !! defaultGradients &&
				!! defaultGradients.length &&
				!! defaultPaletteEnabled && (
					<PaletteEdit
						canReset={ defaultGradients !== baseDefaultGradients }
						canOnlyChangeValues
						gradients={ defaultGradients }
						onChange={ setDefaultGradients }
						paletteLabel={ __( 'Default' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
			{ !! duotonePalette && !! duotonePalette.length && (
				<div>
					<Subtitle level={ 3 }>{ __( 'Duotone' ) }</Subtitle>
					<Spacer margin={ 3 } />
					<DuotonePicker
						duotonePalette={ duotonePalette }
						disableCustomDuotone
						disableCustomColors
						clearable={ false }
						onChange={ noop }
						colorPalette={ [] }
					/>
				</div>
			) }
		</VStack>
	);
}
