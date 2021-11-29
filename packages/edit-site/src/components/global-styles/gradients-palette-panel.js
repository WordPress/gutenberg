/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	__experimentalVStack as VStack,
	__experimentalPaletteEdit as PaletteEdit,
	DuotonePicker,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useSetting } from './hooks';

export default function GradientPalettePanel( { name } ) {
	const [ themeGradients, setThemeGradients ] = useSetting(
		'color.gradients.theme',
		name
	);
	const [ baseThemeGradients ] = useSetting(
		'color.gradients.theme',
		name,
		'base'
	);
	const [ defaultGradients, setDefaultGradients ] = useSetting(
		'color.gradients.default',
		name
	);
	const [ baseDefaultGradients ] = useSetting(
		'color.gradients.default',
		name,
		'base'
	);
	const [ customGradients, setCustomGradients ] = useSetting(
		'color.gradients.custom',
		name
	);

	const [ defaultPaletteEnabled ] = useSetting(
		'color.defaultGradients',
		name
	);
	const [ duotonePalette ] = useSetting( 'color.duotone' ) || [];
	return (
		<VStack
			className="edit-site-global-styles-gradient-palette-panel"
			spacing={ 10 }
		>
			<div>
				<Heading className="edit-site-global-styles-gradient-palette-panel__duotone-heading">
					{ __( 'Duotone' ) }
				</Heading>
				<DuotonePicker
					duotonePalette={ duotonePalette }
					disableCustomDuotone={ true }
					disableCustomColors={ true }
					clearable={ false }
					onChange={ noop }
				/>
			</div>
			{ !! themeGradients && !! themeGradients.length && (
				<PaletteEdit
					canReset={ themeGradients !== baseThemeGradients }
					canOnlyChangeValues
					gradients={ themeGradients }
					onChange={ setThemeGradients }
					paletteLabel={ __( 'Theme' ) }
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
					/>
				) }
			<PaletteEdit
				gradients={ customGradients }
				onChange={ setCustomGradients }
				paletteLabel={ __( 'Custom' ) }
				emptyMessage={ __(
					'Custom gradients are empty! Add some gradients to create your own palette.'
				) }
				slugPrefix="custom-"
			/>
		</VStack>
	);
}
