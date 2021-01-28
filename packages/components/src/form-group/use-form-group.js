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

/**
 * @typedef OwnProps
 * @property {Pick<import('../text/types').Props, 'align'>} [alignLabel='left'] Adjusts the block alignment of children.
 * @property {boolean} [horizontal=true] Displays the label and form field horizontally.
 * @property {string} [label] Label of the form field.
 * @property {string} [help] Displays help content.
 * @property {boolean} [labelHidden=false] Visually hides the label.
 * @property {boolean} [truncate=false] Truncates the label text content.
 */

/** @typedef {import('../grid/types').Props & OwnProps} Props */

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
