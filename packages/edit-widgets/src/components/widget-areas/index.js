/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WidgetArea from '../widget-area';

function WidgetAreas( { areas } ) {
	return areas.map( ( { id }, index ) => (
		<WidgetArea
			key={ id }
			widgetAreaId={ id }
			initialOpen={ index === 0 }
		/>
	) );
}

export default compose( [
	withSelect( ( select ) => {
		const { getWidgetAreas } = select( 'core/edit-widgets' );
		const areas = getWidgetAreas();
		return {
			areas,
		};
	} ),
] )( WidgetAreas );
