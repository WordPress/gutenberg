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
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

import type { Border } from '../../border-control/types';
import type { Borders, BorderSide, BorderBoxControlProps } from '../types';

export function useBorderBoxControl(
	props: WordPressComponentProps< BorderBoxControlProps, 'div' >
) {
	const { className, onChange, value, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControl'
	);

	const mixedBorders = hasMixedBorders( value );
	const splitBorders = hasSplitBorders( value );

	const linkedValue = splitBorders
		? getCommonBorder( value as Borders | undefined )
		: ( value as Border );

	const splitValue = splitBorders
		? ( value as Borders )
		: getSplitBorders( value as Border | undefined );

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
		return cx( styles.BorderBoxControl, className );
	}, [ className ] );

	const linkedControlClassName = useMemo( () => {
		return cx( styles.LinkedBorderControl );
	}, [] );

	return {
		...otherProps,
		className: classes,
		hasMixedBorders: mixedBorders,
		isLinked,
		linkedControlClassName,
		onLinkedChange,
		onSplitChange,
		toggleLinked,
		linkedValue,
		splitValue,
	};
}
