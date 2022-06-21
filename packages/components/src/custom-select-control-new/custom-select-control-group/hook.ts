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
import { SelectControlGroupProps } from '../types';

// TODO:
// - should we allow polymorphism ?
export const useSelectControlGroup = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlGroupProps, 'div', false > ) => {
	const cx = useCx();
	const groupClassName = useMemo(
		() => cx( styles.group, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: groupClassName,
	};
};
