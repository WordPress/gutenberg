/**
 * External dependencies
 */
import classnames from 'classnames';
/* eslint-disable-next-line no-restricted-imports */
import { VisuallyHidden as ReakitVisuallyHidden } from 'reakit';

/**
 * VisuallyHidden component to render text out non-visually
 * for use in devices such as a screen reader.
 *
 * @template {import('reakit-utils').As} TT
 * @param {import('./types').VisuallyHiddenProps<TT>} props
 * @return {JSX.Element} Element
 */
export default function VisuallyHidden( { as, className, ...props } ) {
	const classes = classnames( 'components-visually-hidden', className );
	return (
		<ReakitVisuallyHidden
			as={ as || 'div' }
			className={ classes }
			{ ...props }
		/>
	);
}
