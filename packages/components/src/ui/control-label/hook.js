/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import { useFormGroupContextId } from '../form-group';
import { useText } from '../../text';
import * as styles from './styles';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../context').WordPressComponentProps<import('./types').Props, 'label', false>} props
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

	const cx = useCx();

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
