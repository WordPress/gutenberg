/**
 * Internal dependencies
 */
import TypographyPanel from './typography-panel';
import ScreenHeader from './header';
import { elementsByName } from './elements';

function ScreenTypographyElement( { name, element } ) {
	return (
		<>
			<ScreenHeader
				title={ elementsByName[ element ].title }
				description={ elementsByName[ element ].description }
			/>
			<TypographyPanel name={ name } element={ element } />
		</>
	);
}

export default ScreenTypographyElement;
