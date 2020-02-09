/**
 * Internal dependencies
 */
import { Button } from '../../styled-primitives/button';
import additionalStylesHelper from '../../styled-primitives/additionalStylesHelper';

export default function PrimitiveButton( {
	additionalStyles = [],
	children,
	...props
} ) {
	return (
		<Button { ...props } css={ additionalStylesHelper( additionalStyles ) }>
			{ children }
		</Button>
	);
}
