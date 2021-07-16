/**
 * Internal dependencies
 */
import Button from '../button';
import { contextConnect, useContextSystem } from '../ui/context';
import { useHistory } from './router';

function NavigatorButton( props, forwardedRef ) {
	/* eslint-disable no-unused-vars */
	const {
		as,
		children,
		exact,
		href,
		isBack,
		isPlain,
		params,
		showArrow,
		to,
		...otherProps
	} = useContextSystem( props, 'NavigatorButton' );
	/* eslint-enable no-unused-vars */

	const history = useHistory();

	const handleOnClick = ( event ) => {
		event.preventDefault();

		if ( isBack ) {
			if ( to ) {
				history.push( to, { isBack: true } );
			} else {
				history.goBack();
			}
		} else {
			history.push( to );
		}
	};

	if ( ! to ) {
		return (
			<Button
				href={ href || '#' }
				ref={ forwardedRef }
				{ ...otherProps }
				onClick={ handleOnClick }
			>
				{ children }
			</Button>
		);
	}

	return (
		<Button
			{ ...otherProps }
			exact={ exact }
			onClick={ handleOnClick }
			ref={ forwardedRef }
		>
			{ children }
		</Button>
	);
}

export default contextConnect( NavigatorButton, 'NavigatorButton' );
