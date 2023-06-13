/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';

import type { LinkedButtonProps } from '../types';

export function useBorderBoxControlLinkedButton(
	props: WordPressComponentProps< LinkedButtonProps, 'button' >
) {
	const {
		className,
		size = 'default',
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlLinkedButton' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlLinkedButton( size ), className );
	}, [ className, cx, size ] );

	return { ...otherProps, className: classes };
}
