/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { colord, extend, Colord } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useMemo } from '@wordpress/element';
import { settings } from '@wordpress/icons';
import { useDebounce } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	useContextSystem,
	contextConnect,
	WordPressComponentProps,
} from '../ui/context';
import { HStack } from '../h-stack';
import { Spacer } from '../spacer';
import {
	ColorfulWrapper,
	SelectControl,
	AuxiliaryColorArtefactWrapper,
	DetailsControlButton,
} from './styles';
import { ColorDisplay } from './color-display';
import { ColorInput } from './color-input';
import { Picker } from './picker';
import { useControlledValue } from '../utils/hooks';

import type { ColorType } from './types';

extend( [ namesPlugin ] );

export interface ColorPickerProps {
	enableAlpha?: boolean;
	color?: string;
	onChange?: ( color: string ) => void;
	defaultValue?: string;
	copyFormat?: ColorType;
}

const options = [
	{ label: 'RGB', value: 'rgb' as const },
	{ label: 'HSL', value: 'hsl' as const },
	{ label: 'Hex', value: 'hex' as const },
];

const ColorPicker = (
	props: WordPressComponentProps< ColorPickerProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		enableAlpha = false,
		color: colorProp,
		onChange,
		defaultValue = '#fff',
		copyFormat,
		...divProps
	} = useContextSystem( props, 'ColorPicker' );

	// Use a safe default value for the color and remove the possibility of `undefined`.
	const [ color, setColor ] = useControlledValue( {
		onChange,
		value: colorProp,
		defaultValue,
	} );

	const safeColordColor = useMemo( () => {
		return colord( color || '' );
	}, [ color ] );

	const debouncedSetColor = useDebounce( setColor );

	const handleChange = useCallback(
		( nextValue: Colord ) => {
			debouncedSetColor( nextValue.toHex() );
		},
		[ debouncedSetColor ]
	);

	const [ showInputs, setShowInputs ] = useState< boolean >( false );
	const [ colorType, setColorType ] = useState< ColorType >(
		copyFormat || 'hex'
	);

	return (
		<ColorfulWrapper ref={ forwardedRef } { ...divProps }>
			<Picker
				onChange={ handleChange }
				color={ safeColordColor }
				enableAlpha={ enableAlpha }
			/>
			<AuxiliaryColorArtefactWrapper>
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
							color={ safeColordColor }
							colorType={ copyFormat || colorType }
							enableAlpha={ enableAlpha }
						/>
					) }
					<DetailsControlButton
						isSmall
						onClick={ () => setShowInputs( ! showInputs ) }
						icon={ settings }
						isPressed={ showInputs }
						label={
							showInputs
								? __( 'Hide detailed inputs' )
								: __( 'Show detailed inputs' )
						}
					/>
				</HStack>
				<Spacer margin={ 4 } />
				{ showInputs && (
					<ColorInput
						colorType={ colorType }
						color={ safeColordColor }
						onChange={ handleChange }
						enableAlpha={ enableAlpha }
					/>
				) }
			</AuxiliaryColorArtefactWrapper>
		</ColorfulWrapper>
	);
};

const ConnectedColorPicker = contextConnect( ColorPicker, 'ColorPicker' );

export default ConnectedColorPicker;
