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
import type { SelectControlRowProps } from '../types';

export const useSelectControlRow = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlRowProps, 'div', false > ) => {
	const cx = useCx();
	const rowClassName = useMemo(
		() => cx( styles.row, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: rowClassName,
	};
};
