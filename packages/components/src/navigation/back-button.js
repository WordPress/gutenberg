/**
 * WordPress dependencies
 */
import { Icon, arrowLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Button from '../button';

const NavigationBackButton = ( { backItem, nullText, onClick, rootText } ) => {
	if ( ! backItem && ! rootText ) {
		return null;
	}

	const getText = () => {
		if ( ! backItem ) {
			return nullText;
		} else if ( ! backItem.parent ) {
			return rootText;
		}
		return backItem.title;
	};

	return (
		<Button
			isSecondary
			className="components-navigation__back"
			onClick={ () => onClick( backItem ) }
		>
			<Icon icon={ arrowLeft } />
			{ getText() }
		</Button>
	);
};

export default NavigationBackButton;
