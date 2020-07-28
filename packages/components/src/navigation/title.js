/**
 * Internal dependencies
 */
import Text from '../text';

const NavigationTitle = ( { parentItem, rootText } ) => {
	return (
		<div className="components-navigation__title">
			<Text variant="title.medium">
				{ parentItem ? parentItem.title : rootText }
			</Text>
		</div>
	);
};

export default NavigationTitle;
