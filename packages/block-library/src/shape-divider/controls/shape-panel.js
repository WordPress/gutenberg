/**
 * WordPress dependencies
 */
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ShapeControls from './shape-controls';
import ShapeSelectionPanel from './shape-selection-panel';
import { generatePathValue, PATH_RELATED_PROPS } from '../shapes';

const ShapePanel = ( { dividerHeight, shape, index, updateShape } ) => {
	const { type } = shape;
	const shapeLabel = sprintf(
		// translators: %d is the shape's index.
		__( 'Shape %d' ),
		index + 1
	);

	const changeShape = ( newConfig ) => {
		const newShape = {
			...shape,
			...newConfig,
		};

		// Regenerate shape's SVG path if its config affecting it has changed.
		const newConfigProps = Object.keys( newConfig );
		const updatedPathProps = PATH_RELATED_PROPS.filter( ( prop ) =>
			newConfigProps.includes( prop )
		);

		if ( updatedPathProps.length ) {
			newShape.path = generatePathValue( newShape, dividerHeight );
		}

		// Replace the original shape with the updated one.
		updateShape( newShape, index );
	}

	return (
		<PanelBody
			className="shape-divider-controls__shape"
			initialOpen={ ! type }
			title={ shapeLabel }
		>
			{ !! type ? (
				<ShapeControls shape={ shape } onChange={ changeShape } />
			) : (
				<ShapeSelectionPanel onClick={ changeShape } />
			) }
		</PanelBody>
	);
};

export default ShapePanel;
