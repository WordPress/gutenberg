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
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import Subtitle from './subtitle';
import { unlock } from '../../lock-unlock';

const { useGlobalSetting } = unlock( blockEditorPrivateApis );
const mobilePopoverProps = { placement: 'bottom-start', offset: 8 };

const noop = () => {};

export default function GradientPalettePanel( { name } ) {
	const [ themeGradients, setThemeGradients ] = useGlobalSetting(
		'color.gradients.theme',
		name
	);
	const [ baseThemeGradients ] = useGlobalSetting(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients ] = useGlobalSetting(
		'color.gradients.default',
		name
	);
	const [ baseDefaultGradients ] = useGlobalSetting(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients ] = useGlobalSetting(
		'color.gradients.custom',
		name
	);

	const [ defaultPaletteEnabled ] = useGlobalSetting(
		'color.defaultGradients',
		name
	);

	const [ customDuotone ] = useGlobalSetting( 'color.duotone.custom' ) || [];
	const [ defaultDuotone ] =
		useGlobalSetting( 'color.duotone.default' ) || [];
	const [ themeDuotone ] = useGlobalSetting( 'color.duotone.theme' ) || [];
	const [ defaultDuotoneEnabled ] = useGlobalSetting(
		'color.defaultDuotone'
	);

	const duotonePalette = [
		...( customDuotone || [] ),
		...( themeDuotone || [] ),
		...( defaultDuotone && defaultDuotoneEnabled ? defaultDuotone : [] ),
	];

	const isMobileViewport = useViewportMatch( 'small', '<' );
	const popoverProps = isMobileViewport ? mobilePopoverProps : undefined;

	return (
		<VStack
			className="edit-site-global-styles-gradient-palette-panel"
			spacing={ 10 }
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
						paletteLabelLevel={ 3 }
						popoverProps={ popoverProps }
					/>
				) }
			<PaletteEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				paletteLabel={ __( 'Custom' ) }
				paletteLabelLevel={ 3 }
				emptyMessage={ __(
					'Custom gradients are empty! Add some gradients to create your own palette.'
				) }
				slugPrefix="custom-"
				popoverProps={ popoverProps }
			/>
			{ !! duotonePalette && !! duotonePalette.length && (
				<div>
					<Subtitle level={ 3 }>{ __( 'Duotone' ) }</Subtitle>
					<Spacer margin={ 3 } />
					<DuotonePicker
						duotonePalette={ duotonePalette }
						disableCustomDuotone={ true }
						disableCustomColors={ true }
						clearable={ false }
						onChange={ noop }
					/>
				</div>
			) }
		</VStack>
	);
}
