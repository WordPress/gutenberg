/**
 * External dependencies
 */
import { cx } from 'emotion';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useFormGroupContextId } from '../form-group';
import { useText } from '../../text';
import * as styles from './styles';

/**
 * @param {import('../context').ViewOwnProps<import('./types').Props, 'label'>} props
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
		styles[ /** @type {'small' | 'medium' | 'large'} */ ( size ) ],
		className,
		isBlock ? styles.block : styles.inline
	);

	return {
		...textProps,
		className: classes,
		htmlFor,
	};
}
