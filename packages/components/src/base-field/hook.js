/**
 * External dependencies
 */
import { cx } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../ui/context';
import { useControlGroupContext } from '../ui/control-group';
import { useFlex } from '../flex';
import * as styles from './styles';

/**
 * @typedef OwnProps
 * @property {boolean} [hasError=false] Renders an error.
 * @property {boolean} [disabled]       Whether the field is disabled.
 * @property {boolean} [isInline=false] Renders as an inline element (layout).
 * @property {boolean} [isSubtle=false] Renders a subtle variant.
 */

/** @typedef {import('../flex/types').FlexProps & OwnProps} Props */

/**
 * @param {import('../ui/context').PolymorphicComponentProps<Props, 'div'>} props
 */
export function useBaseField( props ) {
	const {
		className,
		hasError = false,
		isInline = false,
		isSubtle = false,
		// extract these because useFlex doesn't accept it
		defaultValue,
		disabled,
		...flexProps
	} = useContextSystem( props, 'BaseField' );

	const { styles: controlGroupStyles } = useControlGroupContext();

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
		[ className, controlGroupStyles, hasError, isInline, isSubtle ]
	);

	return {
		...useFlex( { ...flexProps, className: classes } ),
		disabled,
		defaultValue,
	};
}
