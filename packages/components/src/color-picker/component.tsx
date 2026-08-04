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

	// Track the last hex we produced so the sync effect can
	// distinguish our own updates from external prop changes.
	const lastProducedHexRef = useRef( safeColordColor.toHex() );

	// While the user is dragging the visual picker, ignore color-prop sync
	// so delayed/stale controlled echoes cannot overwrite internalHSLA mid-drag.
	const isPickerInteractingRef = useRef( false );

	// Sync internalHSLA when the color prop changes externally (e.g.
	// parent passes a new color that wasn't produced by our onChange).
	useEffect( () => {
		if ( isPickerInteractingRef.current ) {
			return;
		}

		// Compare by color equality, not hex string — rgb()/rgba()
		// round-trips can differ in string form for the same color.
		if ( safeColordColor.isEqual( lastProducedHexRef.current ) ) {
			return;
		}

		// Genuinely external change — sync internalHSLA.
		lastProducedHexRef.current = safeColordColor.toHex();
		const externalHSLA = safeColordColor.toHsl();
		setInternalHSLA( ( prev ) => mergeHSLA( externalHSLA, prev ) );
	}, [ safeColordColor ] );

	// Handler for HSL inputs (and the HSVA picker after it converts to HSLA).
	// Apply the user's HSLA, then notify the parent only when the color
	// actually changes. setColor must not run inside setInternalHSLA
	// (state updaters must be pure). Uses direct setColor (not debounced)
	// to avoid races with hex/RGB's debouncedSetColor.
	const handleHSLAChange = useCallback(
		( nextHSLA: HslaColor ) => {
			setInternalHSLA( nextHSLA );
			const previousHex = lastProducedHexRef.current;
			const nextHex = colord( nextHSLA ).toHex();
			if ( ! colord( nextHex ).isEqual( previousHex ) ) {
				lastProducedHexRef.current = nextHex;
				setColor( nextHex );
			}
		},
		[ setColor ]
	);

	// Handler for components that provide Colord values (RGB, Hex inputs).
	// Uses debouncedSetColor since the hex input fires per keystroke.
	const handleChange = useCallback(
		( nextValue: Colord ) => {
			const nextHSLA = nextValue.toHsl();
			setInternalHSLA( ( prev ) => mergeHSLA( nextHSLA, prev ) );
			const nextHex = nextValue.toHex();
			lastProducedHexRef.current = nextHex;
			debouncedSetColor( nextHex );
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
				onChange={ handleHSLAChange }
				hsla={ internalHSLA }
				enableAlpha={ enableAlpha }
				onInteractionStart={ () => {
					isPickerInteractingRef.current = true;
				} }
				onInteractionEnd={ () => {
					isPickerInteractingRef.current = false;
				} }
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

/**
 * `ColorPicker` lets users select a color from a visual color surface, or by
 * editing its hex, RGB, or HSL values.
 */
export const ColorPicker = contextConnect(
	UnconnectedColorPicker,
	'ColorPicker'
);

export default ColorPicker;
