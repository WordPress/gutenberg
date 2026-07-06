import clsx from 'clsx';

import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useFlexContext } from '../context';
import type { FlexItemProps } from '../types';
import styles from '../style.module.scss';

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

	const itemStyle = {
		...style,
		'--wp-components-flex-item-display': display || 'block',
	};

	return {
		...otherProps,
		className: clsx( styles.item, isBlock && styles.block, className ),
		style: itemStyle,
	};
}
