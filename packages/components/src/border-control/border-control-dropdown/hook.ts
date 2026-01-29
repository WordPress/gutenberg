/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { parseQuantityAndUnitFromRawValue } from '../../unit-control/utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';

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
		size = 'default',
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

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderControlDropdown, className );
	}, [ className, cx ] );

	const indicatorClassName = useMemo( () => {
		return cx( styles.borderColorIndicator );
	}, [ cx ] );

	const indicatorWrapperClassName = useMemo( () => {
		return cx( styles.colorIndicatorWrapper( border, size ) );
	}, [ border, cx, size ] );

	const popoverControlsClassName = useMemo( () => {
		return cx( styles.borderControlPopoverControls );
	}, [ cx ] );

	const popoverContentClassName = useMemo( () => {
		return cx( styles.borderControlPopoverContent );
	}, [ cx ] );

	const resetButtonWrapperClassName = useMemo( () => {
		return cx( styles.resetButtonWrapper );
	}, [ cx ] );

	return {
		...otherProps,
		border,
		className: classes,
		colors,
		enableAlpha,
		enableStyle,
		indicatorClassName,
		indicatorWrapperClassName,
		onColorChange,
		onStyleChange,
		onReset,
		popoverContentClassName,
		popoverControlsClassName,
		resetButtonWrapperClassName,
		size,
		__experimentalIsRenderedInSidebar,
	};
}
