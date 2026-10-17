import type { ComponentProps } from 'react';
import type { FontSizePicker as BaseFontSizePicker } from '@wordpress/components';
import type { FontSizePreset } from '@wordpress/global-styles-engine';

/**
 * A font size, either a preset or just a custom size.
 */
export type FontSizeObject =
	| FontSizePreset
	| { size: FontSizePreset[ 'size' ] | undefined; slug?: undefined };

/**
 * Arguments of `getComputedFluidTypographyValue`.
 */
export interface FluidTypographyArgs {
	/**
	 * Minimum viewport size from which type will have fluidity. Optional if
	 * fontSize is specified.
	 */
	minimumViewportWidth?: string | null;
	/**
	 * Maximum size up to which type will have fluidity. Optional if fontSize
	 * is specified.
	 */
	maximumViewportWidth?: string | null;
	/**
	 * Size to derive maximumFontSize and minimumFontSize from, if necessary.
	 * Optional if minimumFontSize and maximumFontSize are specified.
	 */
	fontSize?: string | number | null;
	/**
	 * Maximum font size for any clamp() calculation. Optional.
	 */
	maximumFontSize?: string | null;
	/**
	 * Minimum font size for any clamp() calculation. Optional.
	 */
	minimumFontSize?: string | null;
	/**
	 * A scale factor to determine how fast a font scales within boundaries.
	 * Optional.
	 */
	scaleFactor?: number | null;
	/**
	 * The smallest a calculated font size may be. Optional.
	 */
	minimumFontSizeLimit?: string | null;
}

/**
 * Options of `getTypographyValueAndUnit`.
 */
export interface TypographyValueAndUnitOptions {
	coerceTo?: string;
	rootSizeValue?: number;
	acceptableUnits?: string[];
}

/**
 * A typography value with its unit.
 */
export interface TypographyValueAndUnit {
	value: number;
	unit: string;
}

/**
 * Props of the block editor's `FontSizePicker`, which reads the font sizes
 * from the block settings.
 */
export type FontSizePickerProps = ComponentProps< typeof BaseFontSizePicker >;

/**
 * Props of a component wrapped by `withFontSizes`.
 */
export interface WithFontSizesProps {
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	fontSizes?: FontSizePreset[];
	[ prop: string ]: unknown;
}

/**
 * The props `withFontSizes` injects for the given font size attribute names:
 * the font size object of each name and its `set<Name>` setter.
 */
export type InjectedFontSizesProps< Name extends string > = {
	[ N in Name ]: FontSizeObject & { class?: string };
} & {
	[ N in Name as `set${ Capitalize< N > }` ]: (
		fontSizeValue?: number | string
	) => void;
};

/**
 * Rejects a wrapped component that declares an injected prop with a type the
 * injected value does not fit, naming the props in the error.
 */
export type IncompatibleInjectedProps< Props, Injected > = [
	{
		[ K in keyof Props & keyof Injected ]: Injected[ K ] extends Props[ K ]
			? never
			: K;
	}[ keyof Props & keyof Injected ],
] extends [ never ]
	? unknown
	: {
			incompatibleInjectedProps: {
				[
					K in keyof Props & keyof Injected
				]: Injected[ K ] extends Props[ K ] ? never : K;
			}[ keyof Props & keyof Injected ];
		};

/**
 * The font size objects `withFontSizes` passes, keyed by attribute name.
 */
export type WithFontSizesState = Record<
	string,
	FontSizeObject & { class?: string }
>;

/**
 * The font size setters `withFontSizes` passes, such as `setFontSize`.
 */
export type FontSizeSetters = Record<
	string,
	( fontSizeValue?: number | string ) => void
>;
