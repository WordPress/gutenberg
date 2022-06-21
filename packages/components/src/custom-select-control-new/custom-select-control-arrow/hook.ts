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
import { SelectControlArrowProps } from '../types';

// TODO:
// - should we allow polymorphism ?
export const useSelectControlArrow = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlArrowProps, 'span', false > ) => {
	const cx = useCx();
	const arrowClassName = useMemo(
		() => cx( styles.arrow, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: arrowClassName,
	};
};
