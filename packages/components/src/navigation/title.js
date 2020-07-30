/**
 * Internal dependencies
 */
import Text from '../text';

const NavigationTitle = ( { children } ) => {
	return (
		<div className="components-navigation__title">
			<Text variant="title.medium">{ children }</Text>
		</div>
	);
};

export default NavigationTitle;
