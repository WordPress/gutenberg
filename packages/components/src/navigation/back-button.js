/**
 * WordPress dependencies
 */
import { Icon, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';

const NavigationBackButton = ( { children, onClick } ) => {
	return (
		<Button
			isSecondary
			className="components-navigation__back"
			onClick={ onClick }
		>
			<Icon icon={ arrowLeft } />
			{ children }
		</Button>
	);
};

export default NavigationBackButton;
