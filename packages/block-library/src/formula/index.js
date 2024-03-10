/**
 * WordPress dependencies
 */

/**
 * Internal dependencies
 */
import metadata from './block.json';
import Edit from './edit';
import Save from './save';
import initBlock from '../utils/init-block';

const { name } = metadata;

export { metadata, name };

export const settings = {
	apiVersion: 3,
	icon: 'edit-page',
	example: {
		attributes: {
			formulaSource:
				'\\Delta T_{\\text{heatsink}} = 100W\n\\cdot 0.15 \\frac{K}{W} = 15^\\circ C',
			alt: "At 100W, the heatsink's temperature will rise by 15 degrees Celsius.",
		},
	},
	save: Save,
	edit: Edit,
};

export const init = () => initBlock( { name, metadata, settings } );
