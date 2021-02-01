/**
 * WordPress dependencies
 */
import { useInstanceId } from '@wordpress/compose';

/**
 * External dependencies
 */
import { useContextSystem } from '@wp-g2/context';
import { cx } from '@wp-g2/styles';

/**
 * Internal dependencies
 */
import * as styles from './form-group-styles';

/** @typedef {Pick<import('./form-group-content').Props, 'help' | 'horizontal' | 'labelHidden' | 'label' | 'truncate'>} FormGroupContentProps */

/**
 * @typedef OwnProps
 * @property {Pick<import('./form-group-content').Props, 'align'>} [alignLabel='left'] Adjusts the block alignment of children.
 * @property {import('react').ReactNode} [children] Displays the content for `FormGroup`.
 */

/** @typedef {import('../grid/types').Props & FormGroupContentProps & OwnProps} Props */

/**
 * @param {import('@wp-g2/create-styles').ViewOwnProps<Props, 'div'>} props
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
