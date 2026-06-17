/**
 * External dependencies
 */
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ColorPalette from '..';
import { colorEditingKey } from '../private-keys';
import { slugifyCustomColorName } from '../utils';
import type { ColorObject } from '../types';

const meta: Meta< typeof ColorPalette > = {
	tags: [ 'manifest' ],
	title: 'Components/Selection & Input/Color/ColorPalette',
	id: 'components-colorpalette',
	component: ColorPalette,
	argTypes: {
		as: { control: false },
		onChange: { action: 'onChange', control: false },
		selectedSlug: { control: false },
		value: { control: false },
	},
	parameters: {
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
		componentStatus: {
			status: 'recommended',
			whereUsed: 'global',
		},
	},
};
export default meta;

type ColorPaletteStory = StoryObj< typeof ColorPalette >;

const Template = ( {
	onChange,
	value,
	selectedSlug,
	...args
}: React.ComponentProps< typeof ColorPalette > ) => {
	const [ color, setColor ] = useState< string | undefined >( value );
	const [ slug, setSlug ] = useState< string | undefined >( selectedSlug );

	return (
		<ColorPalette
			{ ...args }
			value={ color }
			selectedSlug={ slug }
			onChange={ ( newColor, index, newSlug ) => {
				setColor( newColor );
				setSlug( newSlug );
				onChange?.( newColor, index, newSlug );
			} }
		/>
	);
};

export const Default: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Red', color: '#f00' },
			{ name: 'White', color: '#fff' },
			{ name: 'Blue', color: '#00f' },
		],
	},
};

export const InitialValue: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Red', color: '#f00' },
			{ name: 'White', color: '#fff' },
			{ name: 'Blue', color: '#00f' },
		],
		value: '#00f',
	},
};

export const MultipleOrigins: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{
				name: 'Primary colors',
				colors: [
					{ name: 'Red', color: '#f00' },
					{ name: 'Yellow', color: '#ff0' },
					{ name: 'Blue', color: '#00f' },
				],
			},
			{
				name: 'Secondary colors',
				colors: [
					{ name: 'Orange', color: '#f60' },
					{ name: 'Green', color: '#0f0' },
					{ name: 'Purple', color: '#60f' },
				],
			},
		],
	},
};

export const DuplicateColors: ColorPaletteStory = {
	render: Template,
	args: {
		colors: [
			{ name: 'Dark Background', slug: 'dark-background', color: '#000' },
			{ name: 'Dark Text', slug: 'dark-text', color: '#000' },
			{ name: 'Brand', slug: 'brand', color: '#0073aa' },
		],
		value: '#000',
		selectedSlug: 'dark-text',
	},
};

export const CSSVariables: ColorPaletteStory = {
	render: ( args ) => (
		<div
			style={ {
				'--red': '#f00',
				'--yellow': '#ff0',
				'--blue': '#00f',
			} }
		>
			<Template { ...args } />
		</div>
	),
	args: {
		colors: [
			{ name: 'Red', color: 'var(--red)' },
			{ name: 'Yellow', color: 'var(--yellow)' },
			{ name: 'Blue', color: 'var(--blue)' },
		],
	},
};

/**
 * `ColorPalette` supports inline palette editing via a **private** API
 * (symbol-keyed prop), used by the WordPress editor. It is intentionally not
 * part of the public component API. This story demonstrates the behavior with
 * a stateful wrapper.
 */
export const WithPaletteEditing: ColorPaletteStory = {
	render: function WithPaletteEditingStory( args ) {
		const [ color, setColor ] = useState< string | undefined >();
		const [ slug, setSlug ] = useState< string | undefined >();
		const [ themeColors, setThemeColors ] = useState< ColorObject[] >( [
			{ name: 'Brand', slug: 'brand', color: '#0073aa' },
			{ name: 'Accent', slug: 'accent', color: '#cc1818' },
		] );
		const [ customColors, setCustomColors ] = useState< ColorObject[] >( [
			{
				name: 'Color 1',
				slug: 'custom-color-1',
				color: '#1d2c5d',
			},
			{
				name: 'Color 2',
				slug: 'custom-color-2',
				color: '#f0b849',
			},
		] );

		const colors = [
			{
				name: 'Theme',
				slug: 'theme',
				colors: themeColors,
			},
			{
				name: 'Custom',
				slug: 'custom',
				colors: customColors,
			},
		];

		const colorEditing = {
			capabilities: {
				custom: 'full' as const,
				theme: 'value' as const,
			},
			onAdd: ( {
				name,
				nextSlug,
				color: hex,
			}: {
				name: string;
				nextSlug?: string;
				color: string;
			} ) => {
				const nextColor: ColorObject = {
					name,
					slug: nextSlug ?? slugifyCustomColorName( name ),
					color: hex,
				};
				setCustomColors( ( prev ) => [ ...prev, nextColor ] );
				setColor( hex );
				setSlug( nextColor.slug );
			},
			onUpdate: ( {
				paletteSlug,
				slug: prevSlug,
				nextSlug,
				name,
				color: hex,
			}: {
				paletteSlug: string;
				slug?: string;
				nextSlug?: string;
				name: string;
				color: string;
			} ) => {
				if ( paletteSlug === 'theme' ) {
					setThemeColors( ( prev ) =>
						prev.map( ( entry ) =>
							entry.slug === prevSlug
								? { ...entry, color: hex }
								: entry
						)
					);
					return;
				}

				const finalSlug = nextSlug ?? slugifyCustomColorName( name );
				setCustomColors( ( prev ) =>
					prev.map( ( entry ) =>
						entry.slug === prevSlug
							? { name, slug: finalSlug, color: hex }
							: entry
					)
				);
				setSlug( finalSlug );
			},
			onDelete: ( { slug: removedSlug }: { slug: string } ) => {
				setCustomColors( ( prev ) =>
					prev.filter( ( entry ) => entry.slug !== removedSlug )
				);
			},
			onPreview: (
				payload: {
					paletteSlug: string;
					slug: string;
					color: string;
				} | null
			) => {
				if ( payload ) {
					setColor( payload.color );
				}
			},
		};

		return (
			<ColorPalette
				{ ...args }
				colors={ colors }
				value={ color }
				selectedSlug={ slug }
				onChange={ ( newColor, _index, newSlug ) => {
					setColor( newColor );
					setSlug( newSlug );
				} }
				{ ...{ [ colorEditingKey ]: colorEditing } }
			/>
		);
	},
	args: {
		disableCustomColors: false,
	},
	parameters: {
		docs: {
			description: {
				story: 'Demonstrates the **private** `colorEditing` capability: theme colors are value-only (pencil, no rename/delete), custom colors are fully editable (add via the `+` tile or the "Add to custom" action, rename, recolor, delete). This API is symbol-keyed and not public.',
			},
		},
	},
};
