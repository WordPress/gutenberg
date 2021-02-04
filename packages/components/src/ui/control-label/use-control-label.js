/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import { useFormGroupContextId } from '../form-group';
import { useText } from '../text';
import * as styles from './control-label-styles';

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<import('./types').Props, 'label'>} props
 */
export function useControlLabel( props ) {
	const {
		htmlFor: htmlForProp,
		isBlock = false,
		size = 'medium',
		truncate = true,
		...otherProps
	} = useContextSystem( props, 'ControlLabel' );

	const { className, ...textProps } = useText( {
		...otherProps,
		isBlock,
		truncate,
	} );

	const htmlFor = useFormGroupContextId( htmlForProp );
	const classes = cx(
		styles.ControlLabel,
		styles[ size ],
		className,
		isBlock ? styles.block : styles.inline
	);

	return {
		...textProps,
		className: classes,
		htmlFor,
	};
}
