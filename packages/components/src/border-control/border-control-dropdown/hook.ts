/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { parseUnit } from '../../unit-control/utils';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

import type { DropdownProps } from '../types';

export function useBorderControlDropdown(
	props: WordPressComponentProps< DropdownProps, 'div' >
) {
	const {
		border,
		className,
		colors,
		onChange,
		previousStyleSelection,
		...otherProps
	} = useContextSystem( props, 'BorderControlDropdown' );

	const [ widthValue ] = parseUnit( border?.width );
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
		return cx( styles.BorderControlDropdown, className );
	}, [ className ] );

	const indicatorClassName = useMemo( () => {
		return cx( styles.BorderColorIndicator );
	}, [] );

	const popoverClassName = useMemo( () => {
		return cx( styles.BorderControlPopover );
	}, [] );

	const popoverControlsClassName = useMemo( () => {
		return cx( styles.BorderControlPopoverControls );
	}, [] );

	const popoverContentClassName = useMemo( () => {
		return cx( styles.BorderControlPopoverContent );
	}, [] );

	const resetButtonClassName = useMemo( () => {
		return cx( styles.ResetButton );
	}, [] );

	return {
		...otherProps,
		border,
		className: classes,
		colors,
		indicatorClassName,
		onColorChange,
		onStyleChange,
		onReset,
		popoverClassName,
		popoverContentClassName,
		popoverControlsClassName,
		resetButtonClassName,
	};
}
