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
import { SelectControlGroupLabelProps } from '../types';

// TODO:
// - should we use 'option' instead of `div` for props inheritance?
// - should we allow polymorphism ?
export const useSelectControlGroupLabel = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlGroupLabelProps, 'div', false > ) => {
	const cx = useCx();
	const groupLabelClassName = useMemo(
		() => cx( styles.groupLabel, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: groupLabelClassName,
	};
};
