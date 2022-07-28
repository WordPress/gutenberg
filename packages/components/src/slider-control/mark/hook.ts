/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import * as styles from '../styles';
import { useContextSystem, WordPressComponentProps } from '../../ui/context';
import { useCx } from '../../utils/hooks';

import type { MarkProps } from '../types';

export function useMark( props: WordPressComponentProps< MarkProps, 'span' > ) {
	const { className, disabled, isFilled, ...otherProps } = useContextSystem(
		props,
		'Mark'
	);

	// Generate dynamic class names.
	const cx = useCx();
	const classes = useMemo( () => {
		return cx( styles.mark( { isFilled, disabled } ), className );
	}, [ className, cx, disabled, isFilled ] );

	const labelClassName = useMemo( () => {
		return cx( styles.markLabel( { isFilled } ) );
	}, [ className, cx, isFilled ] );

	return {
		...otherProps,
		className: classes,
		disabled,
		isFilled,
		labelClassName,
	};
}
