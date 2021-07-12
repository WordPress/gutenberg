/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DEFAULT_PATH_TYPE, SHAPE_TYPES, generateShapeSeed } from '../shapes';

const ShapeSelectionPanel = ( { onClick } ) => {

	const handleClick = ( value ) => {
		const newConfig = { type: value };

		if ( value === 'custom' ) {
			newConfig.style = DEFAULT_PATH_TYPE;
			newConfig.seed = generateShapeSeed();
			newConfig.delta = 75;
		}

		onClick( newConfig );
	};

	return (
		<>
			{ SHAPE_TYPES.map( ( { value, label } ) => (
				<Button
					variant="tertiary"
					onClick={ () => handleClick( value ) }
					key={ `shape-type-button-${ value }` }
				>
					{ label }
				</Button>
			) ) }
		</>
	);
}

export default ShapeSelectionPanel;
