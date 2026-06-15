/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
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
import { useCx } from '../../utils/hooks/use-cx';
import { maybeWarnDeprecated36pxSize } from '../../utils/deprecated-36px-size';

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
		size = 'default',
		value,
		__experimentalIsRenderedInSidebar = false,
		__next40pxDefaultSize,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControl' );

	maybeWarnDeprecated36pxSize( {
		componentName: 'BorderBoxControl',
		__next40pxDefaultSize,
		size,
	} );

	const computedSize =
		size === 'default' && __next40pxDefaultSize ? '__unstable-large' : size;

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

	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControl, className );
	}, [ cx, className ] );

	const linkedControlClassName = useMemo( () => {
		return cx( styles.linkedBorderControl() );
	}, [ cx ] );

	const wrapperClassName = useMemo( () => {
		return cx( styles.wrapper );
	}, [ cx ] );

	return {
		...otherProps,
		className: classes,
		colors,
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
		size: computedSize,
		splitValue,
		wrapperClassName,
		__experimentalIsRenderedInSidebar,
	};
}
