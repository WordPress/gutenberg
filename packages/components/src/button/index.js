/**
 * Internal dependencies
 */
import { Button as NextButton } from '../ui/button';
import { useDeprecatedButtonProps } from './use-deprecated-button-props';

function Button( props ) {
	const cleanedProps = useDeprecatedButtonProps( props );
	return <NextButton { ...cleanedProps } />;
}

export default Button;
