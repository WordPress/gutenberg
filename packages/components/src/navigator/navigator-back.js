/**
 * Internal dependencies
 */
import Button from '../button';
import { contextConnect, useContextSystem } from '../ui/context';
import { useHistory } from './router';

function NavigatorBack( props, forwardedRef ) {
	const { ...otherProps } = useContextSystem( props, 'NavigatorBack' );
	const history = useHistory();

	return (
		<Button
			{ ...otherProps }
			onClick={ history.goBack }
			ref={ forwardedRef }
		/>
	);
}

export default contextConnect( NavigatorBack, 'NavigatorBack' );
