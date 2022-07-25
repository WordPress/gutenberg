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
import type { SelectControlSeparatorProps } from '../types';

export const useSelectControlSeparator = ( {
	className,
	...props
}: WordPressComponentProps< SelectControlSeparatorProps, 'hr', false > ) => {
	const cx = useCx();
	const separatorClassName = useMemo(
		() => cx( styles.separator, className ),
		[ className, cx ]
	);

	return {
		...props,
		className: separatorClassName,
	};
};
