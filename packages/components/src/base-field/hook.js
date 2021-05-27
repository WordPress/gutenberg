/**
 * External dependencies
 */
import { cx } from 'emotion';

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
 * @property {boolean} [error=false] Renders an error.
 * @property {boolean} [disabled] Whether the field is disabled.
 * @property {boolean} [isClickable=false] Renders a `cursor: pointer` on hover.
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
		error = false,
		isClickable = false,
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
				isClickable && styles.clickable,
				isSubtle && styles.subtle,
				error && styles.error,
				isInline && styles.inline,
				className
			),
		[
			className,
			controlGroupStyles,
			error,
			isInline,
			isClickable,
			isSubtle,
		]
	);

	return {
		...useFlex( { ...flexProps, className: classes } ),
		disabled,
		defaultValue,
	};
}
