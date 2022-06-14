/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import type { WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import { SelectControlItemProps } from '../types';

// TODO:
// - should we use 'option' instead of `div` for props inheritance?
// - should we allow polymorphism ?
export const useSelectControlItem = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlItemProps, 'div', false > ) => {
	const cx = useCx();
	const itemClassName = useMemo(
		() => cx( styles.item, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: itemClassName,
	};
};
