import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import {
	applyFormat,
	removeFormat,
	getActiveFormat,
	useAnchor,
} from '@wordpress/rich-text';
import {
	ColorPalette,
	getColorClassName,
	getColorObjectByColorValue,
	getColorObjectByAttributeValues,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import type { RichTextValue } from '@wordpress/rich-text';
import { textColor as settings, transparentValue } from './index';

/**
 * A colour entry from the `color.palette` theme setting.
 */
export interface ColorObject {
	slug: string;
	color: string;
	name: string;
}

export type ColorProperty = 'color' | 'backgroundColor';

interface InlineColorUIProps {
	name: string;
	property: ColorProperty;
	isActive: boolean;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
	onClose: () => void;
	contentRef: React.RefObject< HTMLElement >;
}

interface ColorPickerProps {
	name: string;
	property: ColorProperty;
	value: RichTextValue;
	onChange: ( value: RichTextValue ) => void;
}

function parseCSS( css = '' ): { color?: string; backgroundColor?: string } {
	return css
		.split( ';' )
		.reduce(
			(
				accumulator: { color?: string; backgroundColor?: string },
				rule
			) => {
				if ( rule ) {
					const [ property, value ] = rule.split( ':' );
					if ( property === 'color' ) {
						accumulator.color = value;
					}
					if (
						property === 'background-color' &&
						value !== transparentValue
					) {
						accumulator.backgroundColor = value;
					}
				}
				return accumulator;
			},
			{}
		);
}

export function parseClassName(
	className = '',
	colorSettings: ColorObject[]
): { color?: string } {
	return className
		.split( ' ' )
		.reduce( ( accumulator: { color?: string }, name ) => {
			// `colorSlug` could contain dashes, so simply match the start and end.
			if ( name.startsWith( 'has-' ) && name.endsWith( '-color' ) ) {
				const colorSlug = name
					.replace( /^has-/, '' )
					.replace( /-color$/, '' );
				const colorObject = getColorObjectByAttributeValues(
					colorSettings,
					colorSlug
				);
				// Without a custom color, an unknown slug gives no color.
				accumulator.color = colorObject.color as string | undefined;
			}
			return accumulator;
		}, {} );
}

export function getActiveColors(
	value: RichTextValue,
	name: string,
	colorSettings: ColorObject[]
): {
	color?: string;
	backgroundColor?: string;
} {
	const activeColorFormat = getActiveFormat( value, name );

	if ( ! activeColorFormat ) {
		return {};
	}

	return {
		...parseCSS( activeColorFormat.attributes?.style ),
		...parseClassName( activeColorFormat.attributes?.class, colorSettings ),
	};
}

export function setColors(
	value: RichTextValue,
	name: string,
	colorSettings: ColorObject[],
	colors: { color?: string; backgroundColor?: string }
) {
	const { color, backgroundColor } = {
		...getActiveColors( value, name, colorSettings ),
		...colors,
	};

	if ( ! color && ! backgroundColor ) {
		return removeFormat( value, name );
	}

	const styles: string[] = [];
	const classNames: string[] = [];
	const attributes: { style?: string; class?: string } = {};

	if ( backgroundColor ) {
		styles.push( [ 'background-color', backgroundColor ].join( ':' ) );
	} else {
		// Override default browser color for mark element.
		styles.push( [ 'background-color', transparentValue ].join( ':' ) );
	}

	if ( color ) {
		const colorObject = getColorObjectByColorValue( colorSettings, color );

		if ( colorObject && colorObject.slug ) {
			const colorClassName = getColorClassName(
				'color',
				colorObject.slug
			);

			if ( colorClassName ) {
				classNames.push( colorClassName );
			}
		} else {
			styles.push( [ 'color', color ].join( ':' ) );
		}
	}

	if ( styles.length ) {
		attributes.style = styles.join( ';' );
	}
	if ( classNames.length ) {
		attributes.class = classNames.join( ' ' );
	}

	return applyFormat( value, { type: name, attributes } );
}

function ColorPicker( { name, property, value, onChange }: ColorPickerProps ) {
	const colors = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().colors ?? [];
	}, [] );
	const activeColors = useMemo(
		() => getActiveColors( value, name, colors ),
		[ name, value, colors ]
	);

	return (
		<ColorPalette
			value={ activeColors[ property ] }
			onChange={ ( color: string | undefined ) => {
				onChange(
					setColors( value, name, colors, { [ property ]: color } )
				);
			} }
			enableAlpha
			// Prevent the text and color picker from overlapping.
			__experimentalIsRenderedInSidebar
		/>
	);
}

export default function InlineColorUI( {
	name,
	property,
	value,
	onChange,
	onClose,
	contentRef,
	isActive,
}: InlineColorUIProps ) {
	/*
	 * `isActive` is not part of `FormatType`, but `useAnchor` reads it
	 * dynamically. Hoisting the object out of the call avoids excess property
	 * checking, which only applies to object literals passed inline.
	 */
	const anchorSettings = { ...settings, isActive };
	const popoverAnchor = useAnchor( {
		// eslint-disable-next-line react-hooks/refs
		editableContentElement: contentRef.current,
		settings: anchorSettings,
	} );

	return (
		<Popover
			onClose={ onClose }
			className="format-library__inline-color-popover"
			anchor={ popoverAnchor }
		>
			<ColorPicker
				name={ name }
				property={ property }
				value={ value }
				onChange={ onChange }
			/>
		</Popover>
	);
}
