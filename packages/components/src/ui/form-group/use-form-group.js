/**
 * External dependencies
 */
import { cx } from '@emotion/css';

/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { useContextSystem } from '../context';
import * as styles from './form-group-styles';

/**
 * @param {import('../context').PolymorphicComponentProps<import('./types').FormGroupProps, 'div'>} props
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
