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
	props: WordPressComponentProps< LinkedButtonProps, 'div' >
) {
	const {
		className,
		__next36pxDefaultSize = false,
		...otherProps
	} = useContextSystem( props, 'BorderBoxControlLinkedButton' );

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx(
			styles.BorderBoxControlLinkedButton( __next36pxDefaultSize ),
			className
		);
	}, [ className, cx, __next36pxDefaultSize ] );

	return { ...otherProps, className: classes };
}
