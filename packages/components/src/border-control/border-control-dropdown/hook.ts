import clsx from 'clsx';
import { parseQuantityAndUnitFromRawValue } from '../../unit-control/utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { COLORS } from '../../utils';
import styles from '../style.module.scss';
import type { DropdownProps } from '../types';

export function useBorderControlDropdown(
	props: WordPressComponentProps< DropdownProps, 'div' >
) {
	const {
		border,
		className,
		colors = [],
		enableAlpha = false,
		enableStyle = true,
		onChange,
		previousStyleSelection,
		__experimentalIsRenderedInSidebar = false,
		...otherProps
	} = useContextSystem( props, 'BorderControlDropdown' );

	const [ widthValue ] = parseQuantityAndUnitFromRawValue( border?.width );
	const hasZeroWidth = widthValue === 0;

	const onColorChange = ( color?: string ) => {
		const style =
			border?.style === 'none' ? previousStyleSelection : border?.style;
		const width = hasZeroWidth && !! color ? '1px' : border?.width;

		onChange( { color, style, width } );
	};

	const onStyleChange = ( style?: string ) => {
		const width = hasZeroWidth && !! style ? '1px' : border?.width;
		onChange( { ...border, style, width } );
	};

	const onReset = () => {
		onChange( {
			...border,
			color: undefined,
			style: undefined,
		} );
	};

	const classes = clsx( styles.dropdown, className );

	const { color: indicatorColor, style: indicatorStyle } = border || {};

	return {
		...otherProps,
		border,
		className: classes,
		colors,
		enableAlpha,
		enableStyle,
		indicatorWrapperClassName: styles[ 'color-indicator-wrapper' ],
		// Applied inline as custom properties. Style `none` previews as `solid`;
		// a style without a color falls back to gray-300.
		indicatorWrapperStyle: indicatorStyle
			? {
					'--wp-components-border-control-indicator-style':
						indicatorStyle === 'none' ? 'solid' : indicatorStyle,
					'--wp-components-border-control-indicator-color':
						indicatorColor ??
						( indicatorStyle !== 'none'
							? COLORS.gray[ 300 ]
							: undefined ),
			  }
			: undefined,
		onColorChange,
		onStyleChange,
		onReset,
		popoverControlsClassName: styles[ 'popover-controls' ],
		resetButtonWrapperClassName: styles[ 'reset-button-wrapper' ],
		__experimentalIsRenderedInSidebar,
	};
}
