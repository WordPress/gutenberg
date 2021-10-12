/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import * as styles from './form-group-styles';
import { useCx } from '../../utils/hooks/use-cx';

/**
 * @param {import('../context').WordPressComponentProps<import('./types').FormGroupProps, 'div'>} props
 */
export function useFormGroup( props ) {
	const {
		alignLabel = 'left',
		children,
		className,
		help,
		horizontal = false,
		id: idProp,
		label,
		labelHidden = false,
		truncate = false,
		...otherProps
	} = useContextSystem( props, 'FormGroup' );

	const id = useInstanceId( useFormGroup, 'form-group', idProp );

	const cx = useCx();

	const classes = cx( styles.FormGroup, className );

	const contentProps = {
		alignLabel,
		children,
		help,
		id,
		horizontal,
		label,
		labelHidden,
		truncate,
	};

	return {
		...otherProps,
		className: classes,
		contentProps,
		horizontal,
	};
}
