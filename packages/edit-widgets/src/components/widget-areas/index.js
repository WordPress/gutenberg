/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WidgetArea from '../widget-area';

const EMPTY_ARRAY = [];

function WidgetAreas( {
	areas,
	blockEditorSettings,
	selectedArea,
	setSelectedArea,
} ) {
	return areas.map( ( { id }, index ) => (
		<WidgetArea
			isSelectedArea={ index === selectedArea }
			onBlockSelected={ () => setSelectedArea( index ) }
			blockEditorSettings={ blockEditorSettings }
			key={ id }
			id={ id }
			initialOpen={ index === 0 }
		/>
	) );
}

export default compose( [
	withSelect( ( select ) => {
		const { getEntityRecords } = select( 'core' );
		const areas = getEntityRecords( 'root', 'widgetArea' ) || EMPTY_ARRAY;
		return {
			areas,
		};
	} ),
] )( WidgetAreas );
