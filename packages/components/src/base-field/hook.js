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
import { useCx } from '../utils/hooks/use-cx';

/**
 * @typedef OwnProps
 * @property {boolean} [hasError=false] Renders an error.
 * @property {boolean} [disabled]       Whether the field is disabled.
 * @property {boolean} [isInline=false] Renders as an inline element (layout).
 * @property {boolean} [isSubtle=false] Renders a subtle variant.
 */

/** @typedef {import('../flex/types').FlexProps & OwnProps} Props */

/**
 * @param {import('../ui/context').WordPressComponentProps<Props, 'div'>} props
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
