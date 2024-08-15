/**
 * Internal dependencies
 */
import { PointerCircle } from './styles/focal-point-style';

/**
 * External dependencies
 */
import type { FocalPointProps } from './types';
import type { WordPressComponentProps } from '../context';

export default function FocalPoint( {
	left = '50%',
	top = '50%',
	...props
}: WordPressComponentProps< FocalPointProps, 'div' > ) {
	const style = { left, top };

	return (
		<PointerCircle
			{ ...props }
			className="components-focal-point-picker__icon_container"
			style={ style }
		/>
	);
}
