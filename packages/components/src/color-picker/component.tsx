/**
 * External dependencies
 */
import type { ClipboardEvent, ForwardedRef } from 'react';
import type { Colord } from 'colord';
import { colord, extend, getFormat } from 'colord';
import type { HslaColor } from 'react-colorful';
import namesPlugin from 'colord/plugins/names';

/**
 * WordPress dependencies
 */
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useMemo,
} from '@wordpress/element';
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

/**
 * Merges incoming HSLA with previous state, preserving hue for achromatic
 * colors and saturation only at lightness extremes (black/white) where
 * it has no visual effect.
 */
function mergeHSLA( nextHSLA: HslaColor, prevHSLA: HslaColor ): HslaColor {
	if ( nextHSLA.s === 0 ) {
		if ( nextHSLA.l === 0 || nextHSLA.l === 100 ) {
			return { ...nextHSLA, h: prevHSLA.h, s: prevHSLA.s };
		}
		return { ...nextHSLA, h: prevHSLA.h };
	}
	return nextHSLA;
}

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

	// Internal HSLA state preserves hue and saturation values that
	// would otherwise be lost when converting to/from hex at achromatic
	// colors (e.g. pure black or white where any H/S maps to the same hex).
	const [ internalHSLA, setInternalHSLA ] = useState< HslaColor >( () => ( {
		...safeColordColor.toHsl(),
	} ) );

	// Hex values we sent via onChange but haven't seen echoed back in `color` yet.
	// Helps the sync effect ignore our own updates.
	const producedHexesRef = useRef< string[] >( [ safeColordColor.toHex() ] );
	const MAX_PRODUCED_QUEUE = 20;

	const pushProducedHex = useCallback( ( nextHex: string ) => {
		const produced = producedHexesRef.current;
		produced.push( nextHex );
		while ( produced.length > MAX_PRODUCED_QUEUE ) {
			produced.shift();
		}
	}, [] );

	// Sync internalHSLA when the color prop changes externally (e.g.
	// parent passes a new color that wasn't produced by our onChange).
	useEffect( () => {
		const incomingHex = safeColordColor.toHex();
		const produced = producedHexesRef.current;
		const matchIndex = produced.indexOf( incomingHex );

		if ( matchIndex !== -1 ) {
			// Our own update arriving back. Consume it and everything older,
			// but keep newer in-flight values for recognition.
			produced.splice( 0, matchIndex + 1 );
			return;
		}

		// External change — sync state and reset the pending queue.
		producedHexesRef.current = [ incomingHex ];
		const externalHSLA = safeColordColor.toHsl();
		setInternalHSLA( ( prev ) => mergeHSLA( externalHSLA, prev ) );
	}, [ safeColordColor ] );

	// Handler for HSL-aware components (Picker, HSL inputs) that
	// provide raw HSLA values without information loss.
	// Uses direct setColor (not debounced) to prevent race conditions
	// where a stale debounced hex would overwrite newer internalHSLA.
	// This is safe performance-wise because react-colorful internally
	// throttles its onChange callbacks using requestAnimationFrame.

	const handleHSLAChange = useCallback(
		( nextHSLA: HslaColor ) => {
			// No mergeHSLA here — this handler receives the user's explicit
			// choice from the picker or HSL inputs, with no lossy conversion.
			setInternalHSLA( nextHSLA );
			const previousHex =
				producedHexesRef.current.at( -1 ) ?? safeColordColor.toHex();
			const nextHex = colord( nextHSLA ).toHex();
			// Only notify parent when the hex actually changes. This
			// avoids firing onChange for H/S changes on achromatic
			// colors (e.g. adjusting hue on pure white).
			if ( nextHex !== previousHex ) {
				pushProducedHex( nextHex );
				setColor( nextHex );
			}
		},
		[ setColor, pushProducedHex, safeColordColor ]
	);

	// Handler for components that provide Colord values (RGB, Hex inputs).
	// Uses debouncedSetColor since the hex input fires per keystroke.
	const handleChange = useCallback(
		( nextValue: Colord ) => {
			const nextHSLA = nextValue.toHsl();
			setInternalHSLA( ( prev ) => mergeHSLA( nextHSLA, prev ) );
			const nextHex = nextValue.toHex();
			pushProducedHex( nextHex );
			debouncedSetColor( nextHex );
		},
		[ debouncedSetColor, pushProducedHex ]
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
				onChange={ handleHSLAChange }
				hsla={ internalHSLA }
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
						hsla={ internalHSLA }
						onChange={ handleChange }
						onHSLChange={ handleHSLAChange }
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
