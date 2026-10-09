import { useViewportMatch } from '@wordpress/compose';
import {
	__experimentalVStack as VStack,
	__experimentalPaletteEdit as PaletteEdit,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import type { Gradient } from '@wordpress/global-styles-engine';
import { useSetting } from './hooks';
import { usePaletteSetting } from './use-palette-setting';

const mobilePopoverProps = { placement: 'bottom-start' as const, offset: 8 };

interface GradientPalettePanelProps {
	name?: string;
}

export default function GradientPalettePanel( {
	name,
}: GradientPalettePanelProps ) {
	const [ themeGradients, setThemeGradients, themeGradientsEditProps ] =
		usePaletteSetting< Gradient[] >( 'color.gradients.theme', name );
	const [ baseThemeGradients ] = useSetting< Gradient[] >(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients, defaultGradientsEditProps ] =
		usePaletteSetting< Gradient[] >( 'color.gradients.default', name );
	const [ baseDefaultGradients ] = useSetting< Gradient[] >(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients, customGradientsEditProps ] =
		usePaletteSetting< Gradient[] >( 'color.gradients.custom', name );

	const [ defaultPaletteEnabled ] = useSetting< boolean >(
		'color.defaultGradients',
		name
	);

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
					{ ...themeGradientsEditProps }
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
						{ ...defaultGradientsEditProps }
						paletteLabel={ __( 'Default' ) }
						paletteLabelHeadingLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				{ ...customGradientsEditProps }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelHeadingLevel={ 3 }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
		</VStack>
	);
}
