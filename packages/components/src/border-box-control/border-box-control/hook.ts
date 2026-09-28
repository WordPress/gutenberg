import clsx from 'clsx';
import { useState } from '@wordpress/element';
import styles from '../style.module.scss';
import {
	getBorderDiff,
	getCommonBorder,
	getSplitBorders,
	hasMixedBorders,
	hasSplitBorders,
	isCompleteBorder,
	isEmptyBorder,
} from '../utils';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import type { Border } from '../../border-control/types';
import type { Borders, BorderSide, BorderBoxControlProps } from '../types';

export function useBorderBoxControl(
	props: WordPressComponentProps< BorderBoxControlProps, 'div' >
) {
	const {
		className,
		colors = [],
		onChange,
		enableAlpha = false,
		enableStyle = true,
		hideLabelFromVision,
		label,
		value,
		__experimentalIsRenderedInSidebar = false,
		// Deprecated props, no longer used.
		size: _size,
		__next40pxDefaultSize: _next40pxDefaultSize,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControl' );

	// A visible label gives the control a header row to place the linked/
	// unlinked toggle in, alongside that label. Without one the toggle stays
	// inside the input wrapper, positioned absolutely.
	const hasVisibleLabel = !! label && ! hideLabelFromVision;

	const mixedBorders = hasMixedBorders( value );
	const splitBorders = hasSplitBorders( value );

	const linkedValue = splitBorders
		? getCommonBorder( value as Borders | undefined )
		: ( value as Border );

	const splitValue = splitBorders
		? ( value as Borders )
		: getSplitBorders( value as Border | undefined );

	// If no numeric width value is set, the unit select will be disabled.
	const hasWidthValue = ! isNaN( parseFloat( `${ linkedValue?.width }` ) );

	const [ isLinked, setIsLinked ] = useState( ! mixedBorders );
	const toggleLinked = () => setIsLinked( ! isLinked );

	const onLinkedChange = ( newBorder?: Border ) => {
		if ( ! newBorder ) {
			return onChange( undefined );
		}

		// If we have all props defined on the new border apply it.
		if ( ! mixedBorders || isCompleteBorder( newBorder ) ) {
			return onChange(
				isEmptyBorder( newBorder ) ? undefined : newBorder
			);
		}

		// If we had mixed borders we might have had some shared border props
		// that we need to maintain. For example; we could have mixed borders
		// with all the same color but different widths. Then from the linked
		// control we change the color. We should keep the separate  widths.
		const changes = getBorderDiff(
			linkedValue as Border,
			newBorder as Border
		);
		const updatedBorders = {
			top: { ...( value as Borders )?.top, ...changes },
			right: { ...( value as Borders )?.right, ...changes },
			bottom: { ...( value as Borders )?.bottom, ...changes },
			left: { ...( value as Borders )?.left, ...changes },
		};

		if ( hasMixedBorders( updatedBorders ) ) {
			return onChange( updatedBorders );
		}

		const filteredResult = isEmptyBorder( updatedBorders.top )
			? undefined
			: updatedBorders.top;

		onChange( filteredResult );
	};

	const onSplitChange = (
		newBorder: Border | undefined,
		side: BorderSide
	) => {
		const updatedBorders = { ...splitValue, [ side ]: newBorder };

		if ( hasMixedBorders( updatedBorders ) ) {
			onChange( updatedBorders );
		} else {
			onChange( newBorder );
		}
	};

	// The linked control reserves an inline-end gutter for the absolutely
	// positioned toggle. Once the toggle moves up into the header row that
	// gutter only shortens the input, so drop it.
	const linkedControlClassName = clsx( styles[ 'linked-border-control' ], {
		[ styles[ 'linked-border-control-full-width' ] ]: hasVisibleLabel,
	} );
	const wrapperClassName = styles.wrapper;
	const headerClassName = styles.header;

	return {
		...otherProps,
		className,
		colors,
		hasVisibleLabel,
		headerClassName,
		hideLabelFromVision,
		label,
		disableUnits: mixedBorders && ! hasWidthValue,
		enableAlpha,
		enableStyle,
		hasMixedBorders: mixedBorders,
		isLinked,
		linkedControlClassName,
		onLinkedChange,
		onSplitChange,
		toggleLinked,
		linkedValue,
		splitValue,
		wrapperClassName,
		__experimentalIsRenderedInSidebar,
	};
}
