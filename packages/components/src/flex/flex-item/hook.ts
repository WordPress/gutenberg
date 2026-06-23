/**
 * External dependencies
 */
import clsx from 'clsx';
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useFlexContext } from '../context';
import type { FlexItemProps } from '../types';
import styles from '../style.module.scss';

type FlexItemStyle = CSSProperties & {
	'--wp-components-flex-item-display'?: CSSProperties[ 'display' ];
};

export function useFlexItem(
	props: WordPressComponentProps< FlexItemProps, 'div' >
) {
	const {
		className,
		display: displayProp,
		isBlock = false,
		style,
		...otherProps
	} = useContextSystem( props, 'FlexItem' );

	const contextDisplay = useFlexContext().flexItemDisplay;
	const display = displayProp || contextDisplay;

	const itemStyle: FlexItemStyle = {
		...( display && { '--wp-components-flex-item-display': display } ),
		...style,
	};

	return {
		...otherProps,
		className: clsx( styles.item, isBlock && styles.block, className ),
		style: itemStyle,
	};
}
