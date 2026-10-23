import { __ } from '@wordpress/i18n';
import { useMemo, useState } from '@wordpress/element';
import { RichTextToolbarButton, useSettings } from '@wordpress/block-editor';
import { ColorIndicator } from '@wordpress/components';
import {
	color as colorIcon,
	textColor as textColorIcon,
} from '@wordpress/icons';
import type { FormatEditProps } from '../types';
import { default as InlineColorUI, getActiveColors, setColors } from './inline';
import type { ColorObject, ColorProperty } from './inline';

export const transparentValue = 'rgba(0, 0, 0, 0)';

const name = 'core/text-color';
const title = __( 'Highlight' );

const EMPTY_ARRAY: ColorObject[] = [];

function getComputedStyleProperty( element: HTMLElement, property: string ) {
	const { ownerDocument } = element;
	const { defaultView } = ownerDocument;
	const style = defaultView?.getComputedStyle( element );
	const value = style?.getPropertyValue( property );

	if (
		property === 'background-color' &&
		value === transparentValue &&
		element.parentElement
	) {
		return getComputedStyleProperty( element.parentElement, property );
	}

	return value;
}

function fillComputedColors(
	element: HTMLElement | null,
	{ color, backgroundColor }: { color?: string; backgroundColor?: string }
) {
	// `element` is the editable content element, which is null before the
	// rich text mounts. There are no computed styles to read without it.
	if ( ! element || ( ! color && ! backgroundColor ) ) {
		return;
	}

	return {
		color: color || getComputedStyleProperty( element, 'color' ),
		backgroundColor:
			backgroundColor === transparentValue
				? getComputedStyleProperty( element, 'background-color' )
				: backgroundColor,
	};
}

const CONTROLS: {
	property: ColorProperty;
	title: string;
	icon: typeof colorIcon;
}[] = [
	{
		property: 'color',
		title: __( 'Text color' ),
		icon: textColorIcon,
	},
	{
		property: 'backgroundColor',
		title: __( 'Highlight color' ),
		icon: colorIcon,
	},
];

// The toolbar `Icon` wrapper sizes its glyph to 24px. `ColorIndicator` is a
// 20px circle, so box it to the same footprint as the icon it replaces, or
// the menu item text shifts when a color is active.
function ColorIndicatorIcon( { colorValue }: { colorValue: string } ) {
	return (
		<span className="format-library-text-color-indicator">
			<ColorIndicator colorValue={ colorValue } />
		</span>
	);
}

function TextColorEdit( {
	value,
	onChange,
	isActive,
	contentRef,
}: FormatEditProps ) {
	// The settings hold the custom color flag and the palette.
	const [ allowCustomControl, colors = EMPTY_ARRAY ] = useSettings(
		'color.custom',
		'color.palette'
	) as [ boolean | undefined, ColorObject[] | undefined ];
	const [ editingProperty, setEditingProperty ] =
		useState< ColorProperty | null >( null );
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ value, colors ]
	);
	const colorIndicatorStyle = useMemo(
		() => fillComputedColors( contentRef.current, activeColors ),
		[ contentRef, activeColors ]
	);

	const hasColorsToChoose = !! colors.length || allowCustomControl;
	if ( ! hasColorsToChoose && ! isActive ) {
		return null;
	}

	return (
		<>
			{ CONTROLS.map( ( { property, title: controlTitle, icon } ) => {
				const isPropertyActive = !! activeColors[ property ];
				// Show the active color in place of the icon.
				const indicatorColor = isPropertyActive
					? ( colorIndicatorStyle?.[ property ] ??
						activeColors[ property ] )
					: undefined;

				return (
					<RichTextToolbarButton
						key={ property }
						className="format-library-text-color-button"
						isActive={ isPropertyActive }
						icon={
							indicatorColor ? (
								<ColorIndicatorIcon
									colorValue={ indicatorColor }
								/>
							) : (
								icon
							)
						}
						title={ controlTitle }
						// If has no colors to choose but a color is active
						// remove that color onClick.
						onClick={
							hasColorsToChoose
								? () => setEditingProperty( property )
								: () =>
										onChange(
											setColors( value, name, colors, {
												[ property ]: undefined,
											} )
										)
						}
						role="menuitemcheckbox"
					/>
				);
			} ) }
			{ editingProperty && (
				<InlineColorUI
					name={ name }
					property={ editingProperty }
					onClose={ () => setEditingProperty( null ) }
					value={ value }
					onChange={ onChange }
					contentRef={ contentRef }
					isActive={ isActive }
				/>
			) }
		</>
	);
}

export const textColor = {
	name,
	title,
	tagName: 'mark',
	className: 'has-inline-color',
	attributes: {
		style: 'style',
		class: 'class',
	},
	edit: TextColorEdit,
};
