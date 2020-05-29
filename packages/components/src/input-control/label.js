/**
 * Internal dependencies
 */
import VisuallyHidden from '../visually-hidden';
import { Label as BaseLabel } from './styles/input-control-styles';

export default function Label( {
	children,
	hideLabelFromVision,
	htmlFor,
	...props
} ) {
	if ( ! children ) return null;

	if ( hideLabelFromVision ) {
		return (
			<VisuallyHidden as="label" htmlFor={ htmlFor }>
				{ children }
			</VisuallyHidden>
		);
	}

	return (
		<BaseLabel htmlFor={ htmlFor } { ...props }>
			{ children }
		</BaseLabel>
	);
}
