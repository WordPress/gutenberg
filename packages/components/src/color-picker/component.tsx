/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import type { Colord } from 'colord';
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useMemo } from '@wordpress/element';
import { useDebounce, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { useContextSystem, contextConnect } from '../context';
import {
	ColorfulWrapper,
	SelectControl,
	AuxiliaryColorArtefactWrapper,
	AuxiliaryColorArtefactHStackHeader,
	ColorInputWrapper,
} from './styles';
import { ColorCopyButton } from './color-copy-button';
import { ColorInput } from './color-input';
import { Picker } from './picker';
import { useControlledValue } from '../utils/hooks';

import type { ColorPickerProps, ColorType } from './types';

extend( [ namesPlugin ] );

const options = [
	{ label: 'RGB', value: 'rgb' as const },
	{ label: 'HSL', value: 'hsl' as const },
	{ label: 'Hex', value: 'hex' as const },
];

const UnconnectedColorPicker = (
	props: ColorPickerProps,
	forwardedRef: ForwardedRef< any >
) => {
	const {
		enableAlpha = false,
		color: colorProp,
		onChange,
		defaultValue = '#fff',
		copyFormat,

		// Context
		onPickerDragStart,
		onPickerDragEnd,
		...divProps
	} = useContextSystem<
		ColorPickerProps & {
			onPickerDragStart?: ( event: MouseEvent ) => void;
			onPickerDragEnd?: ( event: MouseEvent ) => void;
		}
	>( props, 'ColorPicker' );

	const [ containerEl, setContainerEl ] = useState< HTMLElement | null >(
		null
	);
	const containerRef = ( node: HTMLElement | null ) => {
		setContainerEl( node );
	};

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

	const [ colorType, setColorType ] = useState< ColorType >(
		copyFormat || 'hex'
	);

	return (
		<ColorfulWrapper
			ref={ useMergeRefs( [ containerRef, forwardedRef ] ) }
			{ ...divProps }
		>
			<Picker
				containerEl={ containerEl }
				onChange={ handleChange }
				color={ safeColordColor }
				enableAlpha={ enableAlpha }
				onDragStart={ onPickerDragStart }
				onDragEnd={ onPickerDragEnd }
			/>
			<AuxiliaryColorArtefactWrapper>
				<AuxiliaryColorArtefactHStackHeader justify="space-between">
					<SelectControl
						__nextHasNoMarginBottom
						options={ options }
						value={ colorType }
						onChange={ ( nextColorType ) =>
							setColorType( nextColorType as ColorType )
						}
						label={ __( 'Color format' ) }
						hideLabelFromVision
					/>
					<ColorCopyButton
						color={ safeColordColor }
						colorType={ copyFormat || colorType }
					/>
				</AuxiliaryColorArtefactHStackHeader>
				<ColorInputWrapper direction="column" gap={ 2 }>
					<ColorInput
						colorType={ colorType }
						color={ safeColordColor }
						onChange={ handleChange }
						enableAlpha={ enableAlpha }
					/>
				</ColorInputWrapper>
			</AuxiliaryColorArtefactWrapper>
		</ColorfulWrapper>
	);
};

export const ColorPicker = contextConnect(
	UnconnectedColorPicker,
	'ColorPicker'
);

export default ColorPicker;
