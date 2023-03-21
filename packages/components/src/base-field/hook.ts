/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem, WordPressComponentProps } from '../ui/context';
import { useControlGroupContext } from '../ui/control-group';
import { useFlex } from '../flex';
import * as styles from './styles';
import { useCx } from '../utils/hooks/use-cx';
import type { BaseFieldProps } from './types';

export function useBaseField(
	props: WordPressComponentProps< BaseFieldProps, 'div' >
) {
	const {
		className,
		hasError = false,
		isInline = false,
		isSubtle = false,
		// Extract these because useFlex doesn't accept it.
		defaultValue,
		disabled,
		...flexProps
	} = useContextSystem( props, 'BaseField' );

	const { styles: controlGroupStyles } = useControlGroupContext();
	const cx = useCx();

	const classes = useMemo(
		() =>
			cx(
				styles.BaseField,
				controlGroupStyles,
				isSubtle && styles.subtle,
				hasError && styles.error,
				isInline && styles.inline,
				className
			),
		[ className, controlGroupStyles, cx, hasError, isInline, isSubtle ]
	);

	return {
		...useFlex( { ...flexProps, className: classes } ),
		disabled,
		defaultValue,
	};
}
