/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { ControlLabel } from '../control-label';
import VisuallyHidden from '../../visually-hidden';

/**
 * @param {import('../context').ViewOwnProps<import('./types').FormGroupLabelProps, 'label'>} props
 * @return {JSX.Element | null} The form group's label.
 */
function FormGroupLabel( { children, id, labelHidden = false, ...props } ) {
	if ( ! children ) return null;

	if ( labelHidden ) {
		return (
			<VisuallyHidden as="label" htmlFor={ id?.toString() }>
				{ children }
			</VisuallyHidden>
		);
	}

	return <ControlLabel { ...props }>{ children }</ControlLabel>;
}

export default memo( FormGroupLabel );
