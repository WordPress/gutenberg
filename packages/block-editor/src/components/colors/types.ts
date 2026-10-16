import type { ComponentClass, ComponentType, FunctionComponent } from 'react';
import type { Color } from '@wordpress/global-styles-engine';
import type { IncompatibleInjectedProps } from '../font-sizes/types';

/**
 * A color, either a palette entry or just a custom color.
 */
export type ColorObject =
	Color | { color: string | null | undefined; slug?: undefined };

/**
 * A color type `withColors` handles: an attribute name, or an object mapping
 * attribute names to color contexts.
 */
export type ColorType = string | Record< string, string >;

/**
 * Props of a component wrapped by `withColors`.
 */
export interface WithColorsProps {
	attributes: Record< string, unknown >;
	setAttributes: ( attributes: Record< string, unknown > ) => void;
	colors?: Color[];
	[ prop: string ]: unknown;
}

/**
 * The color attribute names a color type stands for.
 */
export type ColorAttributeName< Type extends ColorType > = Type extends string
	? Type
	: keyof Type & string;

/**
 * The props `withColors` injects for the given color attribute names: the
 * color object of each name, its `set<Name>` setter and the color utils.
 */
export type InjectedColorsProps< Name extends string > = {
	[ N in Name ]: ColorObject & { class?: string };
} & {
	[ N in Name as `set${ Capitalize< N > }` ]: (
		newColorValue?: string
	) => void;
} & {
	colorUtils: {
		getMostReadableColor: ( colorValue?: string ) => string;
	};
};

/**
 * The higher-order component `withColors` returns for the given color
 * attribute names.
 */
export type WithColorsHOC< Name extends string > = < Props >(
	WrappedComponent: (
		| FunctionComponent< Props & InjectedColorsProps< Name > >
		// A class component's `props` type must match, so it takes its own props.
		| ComponentClass< Props >
	) &
		IncompatibleInjectedProps< Props, InjectedColorsProps< Name > >
) => ComponentType<
	Omit< Props, keyof InjectedColorsProps< Name > > &
		Pick< WithColorsProps, 'attributes' | 'setAttributes' >
>;
