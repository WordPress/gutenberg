/**
 * External dependencies
 */
// Disable reason: Temporarily disable for existing usages
// until we remove them as part of https://github.com/WordPress/gutenberg/issues/30503#deprecating-emotion-css
// eslint-disable-next-line no-restricted-imports
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
