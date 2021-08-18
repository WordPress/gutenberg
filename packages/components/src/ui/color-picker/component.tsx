/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
import type { ColorFormats } from 'tinycolor2';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import { moreVertical } from '@wordpress/icons';
import { useDebounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useContextSystem,
	contextConnect,
	PolymorphicComponentProps,
} from '../context';
import { HStack } from '../../h-stack';
import Button from '../../button';
import { Spacer } from '../../spacer';
import { ColorfulWrapper, SelectControl } from './styles';
import { ColorDisplay } from './color-display';
import { ColorInput } from './color-input';
import { Picker } from './picker';
import { useControlledValue } from '../../utils/hooks';

import type { ColorType } from './types';

export interface ColorPickerProps {
	enableAlpha?: boolean;
	color?: ColorFormats.HSL | ColorFormats.HSLA;
	onChange?: ( color: ColorFormats.HSL | ColorFormats.HSLA ) => void;
	defaultValue?: ColorFormats.HSL | ColorFormats.HSLA;
	copyFormat?: ColorType;
}

const options = [
	{ label: 'RGB', value: 'rgb' as const },
	{ label: 'HSL', value: 'hsl' as const },
	{ label: 'Hex', value: 'hex' as const },
];

const getSafeColor = (
	color: ColorFormats.HSL | ColorFormats.HSLA | undefined
): ColorFormats.HSLA => {
	return color ? { a: 1, ...color } : { h: 0, s: 0, l: 100, a: 1 };
};

const ColorPicker = (
	props: PolymorphicComponentProps< ColorPickerProps, 'div', false >,
	forwardedRef: Ref< any >
) => {
	const {
		enableAlpha = false,
		color: colorProp,
		onChange,
		defaultValue,
		copyFormat,
		...divProps
	} = useContextSystem( props, 'ColorPicker' );

	const [ color, setColor ] = useControlledValue( {
		onChange,
		value: colorProp,
		defaultValue,
	} );

	// Debounce to prevent rapid changes from conflicting with one another.
	const debouncedSetColor = useDebounce( setColor );

	const handleChange = (
		nextValue: ColorFormats.HSLA | ColorFormats.HSL
	) => {
		debouncedSetColor( nextValue );
	};

	// Use a safe default value for the color and remove the possibility of `undefined`.
	const safeColor = getSafeColor( color );

	const [ showInputs, setShowInputs ] = useState< boolean >( false );
	const [ colorType, setColorType ] = useState< ColorType >(
		copyFormat || 'hex'
	);

	return (
		<ColorfulWrapper ref={ forwardedRef } { ...divProps }>
			<Picker
				onChange={ handleChange }
				color={ safeColor }
				enableAlpha={ enableAlpha }
			/>
			<HStack justify="space-between">
				{ showInputs ? (
					<SelectControl
						options={ options }
						value={ colorType }
						onChange={ ( nextColorType ) =>
							setColorType( nextColorType as ColorType )
						}
						label={ __( 'Color format' ) }
						hideLabelFromVision
					/>
				) : (
					<ColorDisplay
						color={ safeColor }
						colorType={ copyFormat || colorType }
						enableAlpha={ enableAlpha }
					/>
				) }
				<Button
					onClick={ () => setShowInputs( ! showInputs ) }
					icon={ moreVertical }
					isPressed={ showInputs }
					label={
						showInputs
							? __( 'Hide detailed inputs' )
							: __( 'Show detailed inputs' )
					}
				/>
			</HStack>
			<Spacer />
			{ showInputs && (
				<ColorInput
					colorType={ colorType }
					color={ safeColor }
					onChange={ handleChange }
					enableAlpha={ enableAlpha }
				/>
			) }
		</ColorfulWrapper>
	);
};

const ConnectedColorPicker = contextConnect( ColorPicker, 'ColorPicker' );

export default ConnectedColorPicker;
