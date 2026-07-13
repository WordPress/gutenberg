/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import type { WordPressComponentProps } from '../../context';
import { useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';

import type { LinkedButtonProps } from '../types';

export function useBorderBoxControlLinkedButton(
	props: WordPressComponentProps< LinkedButtonProps, 'button' >
) {
	const { className, ...otherProps } = useContextSystem(
		props,
		'BorderBoxControlLinkedButton'
	);

	// Generate class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.borderBoxControlLinkedButton, className );
	}, [ className, cx ] );

	return { ...otherProps, className: classes };
}
