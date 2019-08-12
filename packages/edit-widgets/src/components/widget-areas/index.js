/**
 * WordPress dependencies
 */
import { useEffect, useMemo, useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { transformMediaQueries } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import WidgetArea from '../widget-area';

function WidgetAreas( { areas, blockEditorSettings } ) {
	useEffect( () => {
		// Todo: The partial paths should be a setting that includes styles added by the plugins.
		transformMediaQueries( [
			'.edit-widgets-widget-areas',
			'.edit-widgets-popover-slot',
		], [
			'block-editor/style.css',
			'block-library/style.css',
			'block-library/theme.css',
			'block-library/editor.css',
			'format-library/style.css',
		] );
	}, [] );
	const [ selectedArea, setSelectedArea ] = useState( 0 );
	const onBlockSelectedInArea = useMemo(
		() => areas.map( ( value, index ) => ( () => {
			setSelectedArea( index );
		} ) ),
		[ areas, setSelectedArea ]
	);

	return (
		<div className="edit-widgets-widget-areas">
			{ areas.map( ( { id }, index ) => (
				<WidgetArea
					isSelectedArea={ index === selectedArea }
					onBlockSelected={ onBlockSelectedInArea[ index ] }
					blockEditorSettings={ blockEditorSettings }
					key={ id }
					id={ id }
					initialOpen={ index === 0 }
				/>
			) ) }
		</div>
	);
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
