/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { DEFAULT_SHAPE } from '../shapes';
import ShapePanel from './shape-panel';
import ShapesDropdownMenu from './shapes-dropdown-menu';

const ShapesPanel = ( { attributes, setAttributes } )  => {
	const { height, shapes } = attributes;

	const addShape = () => {
		setAttributes( { shapes: [ ...shapes, DEFAULT_SHAPE ] } );
	};

	const removeShape = ( index ) => {
		const newShapes = [ ...shapes ];
		newShapes.splice( index, 1 );
		setAttributes( { shapes: newShapes } );
	};

	const updateShape = ( shape, index ) => {
		const newShapes = [ ...shapes ];
		newShapes.splice( index, 1, shape );
		setAttributes( { shapes: newShapes } );
	};

	return (
		<div className="shape-divider-controls">
			<h2 className="shape-divider-controls__title">
				{ __( 'Shapes' ) }
				<ShapesDropdownMenu
					shapes={ shapes }
					addShape={ addShape }
					removeShape={ removeShape }
				/>
			</h2>
			{ shapes.map( ( shape, index ) => (
				<ShapePanel
					key={ `shape-divider-shape-${ index }` }
					shape={ shape }
					index={ index }
					dividerHeight={ height }
					updateShape={ updateShape }
				/>
			) ) }
		</div>
	);
};

export default ShapesPanel;
