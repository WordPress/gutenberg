/**
 * WordPress dependencies
 */
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { VIEW_BOX_HEIGHT, generatePathValue } from '../shapes';

const ShapeDividerPanel = ( { attributes, setAttributes } ) => {
	const { height, shapes } = attributes;

	const handleHeightChange = ( newHeight ) => {
		const updatedShapes = shapes.map( ( shape ) => {
			return {
				...shape,
				path: generatePathValue( shape, newHeight ),
			};
		} );

		setAttributes( { height: newHeight, shapes: updatedShapes } );
	}

	return (
		<PanelBody title={ __( 'Divider settings' ) }>
			<RangeControl
				label={ __( 'Height in pixels' ) }
				min={ 5 }
				max={ Math.max( VIEW_BOX_HEIGHT, height ) }
				value={ height }
				onChange={ handleHeightChange }
			/>
		</PanelBody>
	)
};

export default ShapeDividerPanel;
