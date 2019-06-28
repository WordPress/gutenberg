/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import WidgetArea from '../widget-area';

function WidgetAreas( { areas, blockEditorSettings } ) {
	const [ selectedArea, setSelectedArea ] = useState( 0 );
	const onBlockSelectedInArea = useMemo(
		() => areas.map( ( value, index ) => ( () => {
			setSelectedArea( index );
		} ) ),
		[ areas, setSelectedArea ]
	);

	return areas.map( ( { id }, index ) => (
		<WidgetArea
			isSelectedArea={ index === selectedArea }
			onBlockSelected={ onBlockSelectedInArea[ index ] }
			blockEditorSettings={ blockEditorSettings }
			key={ id }
			id={ id }
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
