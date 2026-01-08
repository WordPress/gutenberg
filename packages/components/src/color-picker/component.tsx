/**
 * External dependencies
 */
import type { ClipboardEvent, ForwardedRef } from 'react';
import type { Colord } from 'colord';
import { colord, extend, getFormat } from 'colord';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import { useCallback, useState, useMemo } from '@wordpress/element';
import { useDebounce } from '@wordpress/compose';
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

	const [ colorType, setColorType ] = useState< ColorType >(
		copyFormat || 'hex'
	);

	/*
	 * ! Listener intended for the CAPTURE phase
	 *
	 * Capture paste events over the entire color picker, looking for clipboard
	 * data that could be parsed as a color. If not, let the paste event
	 * propagate normally, so that individual input controls within the
	 * component have a chance to handle it.
	 */
	const maybeHandlePaste = useCallback(
		( event: ClipboardEvent ) => {
			const pastedText = event.clipboardData?.getData( 'text' )?.trim();
			if ( ! pastedText ) {
				return;
			}

			const parsedColor = colord( pastedText );
			if ( ! parsedColor.isValid() ) {
				return;
			}

			// Apply all valid colors, even if the format isn't supported in
			// the UI (e.g. names like "cyan" or, in the future color spaces
			// like "lch" if we add the right colord plugins)
			handleChange( parsedColor );

			// This redundancy helps TypeScript and is safer than assertions
			const supportedFormats: Record< string, ColorType | undefined > = {
				hex: 'hex',
				rgb: 'rgb',
				hsl: 'hsl',
			};

			const detectedFormat = String( getFormat( pastedText ) );
			const newColorType = supportedFormats[ detectedFormat ];
			if ( newColorType ) {
				setColorType( newColorType );
			}

			// Stop at capture phase; no bubbling
			event.stopPropagation();
			event.preventDefault();
		},
		[ handleChange, setColorType ]
	);

	return (
		<ColorfulWrapper
			ref={ forwardedRef }
			{ ...divProps }
			onPasteCapture={ maybeHandlePaste }
		>
			<Picker
				onChange={ handleChange }
				color={ safeColordColor }
				enableAlpha={ enableAlpha }
			/>
			<AuxiliaryColorArtefactWrapper>
				<AuxiliaryColorArtefactHStackHeader justify="space-between">
					<SelectControl
						size="compact"
						options={ options }
						value={ colorType }
						onChange={ ( nextColorType ) =>
							setColorType( nextColorType as ColorType )
						}
						label={ __( 'Color format' ) }
						hideLabelFromVision
						variant="minimal"
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
