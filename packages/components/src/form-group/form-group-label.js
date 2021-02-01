/**
 * WordPress dependencies
 */
import { memo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ControlLabel from '../control-label';
import VisuallyHidden from '../visually-hidden';

/**
 * @typedef OwnProps
 * @property {boolean} [labelHidden] Visually renders the label.
 * @property {string} [id] The id of the FormGroup.
 */

/** @typedef {import('../control-label/use-control-label').Props & OwnProps} Props */

/**
 * @param {Props} props
 */
function FormGroupLabel( { children, id, labelHidden = false, ...props } ) {
	if ( ! children ) return null;

	if ( labelHidden ) {
		return (
			<VisuallyHidden as="label" htmlFor={ id }>
				{ children }
			</VisuallyHidden>
		);
	}

	return <ControlLabel { ...props }>{ children }</ControlLabel>;
}

export default memo( FormGroupLabel );
