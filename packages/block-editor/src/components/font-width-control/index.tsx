import { CustomSelectControl } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';

/*
 * The widths `font-stretch` names, with the percentage each stands for. A face
 * declares its width the same way, so these are the names a family's faces and
 * a variable font's `wdth` axis are both described with.
 */
const FONT_WIDTHS = [
	{ name: _x( 'Ultra Condensed', 'font width' ), value: 'ultra-condensed' },
	{ name: _x( 'Extra Condensed', 'font width' ), value: 'extra-condensed' },
	{ name: _x( 'Condensed', 'font width' ), value: 'condensed' },
	{ name: _x( 'Semi Condensed', 'font width' ), value: 'semi-condensed' },
	{ name: _x( 'Normal', 'font width' ), value: 'normal' },
	{ name: _x( 'Semi Expanded', 'font width' ), value: 'semi-expanded' },
	{ name: _x( 'Expanded', 'font width' ), value: 'expanded' },
	{ name: _x( 'Extra Expanded', 'font width' ), value: 'extra-expanded' },
	{ name: _x( 'Ultra Expanded', 'font width' ), value: 'ultra-expanded' },
];

const DEFAULT_OPTION = {
	key: 'default',
	name: __( 'Default' ),
	style: { fontStretch: undefined },
};

type FontWidthControlProps = {
	value?: string;
	onChange: ( value?: string ) => void;
};

/**
 * Picks the width a font is drawn at: one of a family's own condensed or
 * expanded faces, or a coordinate on a variable font's `wdth` axis.
 *
 * The value is written and the browser matches the nearest face it has. A
 * width the font does not have is not synthesised, unlike a weight or a
 * slant, so nothing here invents one.
 *
 * @param props          Component props.
 * @param props.value    The current `font-stretch` value.
 * @param props.onChange Called with the next value.
 * @return The control.
 */

export default function FontWidthControl( {
	value,
	onChange,
}: FontWidthControlProps ) {
	const options = [
		DEFAULT_OPTION,
		...FONT_WIDTHS.map( ( { name, value: width } ) => ( {
			key: width,
			name,
			style: { fontStretch: width },
		} ) ),
	];

	return (
		<CustomSelectControl
			label={ __( 'Width' ) }
			options={ options }
			value={
				options.find( ( option ) => option.key === value ) ??
				DEFAULT_OPTION
			}
			onChange={ ( { selectedItem } ) =>
				onChange(
					selectedItem.key === 'default'
						? undefined
						: selectedItem.key
				)
			}
		/>
	);
}
