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
import type { SelectControlItemCheckProps } from '../types';

export const useSelectControlItemCheck = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlItemCheckProps, 'span', false > ) => {
	const cx = useCx();
	const itemCheckClassName = useMemo(
		() => cx( styles.itemCheck, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: itemCheckClassName,
	};
};
