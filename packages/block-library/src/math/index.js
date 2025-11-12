/**
 * WordPress dependencies
 */
import { math as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}',
			mathML: '<semantics><mrow><mi>x</mi><mo>=</mo><mfrac><mrow><mo lspace="0em" rspace="0em">−</mo><mi>b</mi><mo>±</mo><msqrt><mrow><msup><mi>b</mi><mn>2</mn></msup><mo>−</mo><mn>4</mn><mi>a</mi><mi>c</mi></mrow></msqrt></mrow><mrow><mn>2</mn><mi>a</mi></mrow></mfrac></mrow><annotation encoding="application/x-tex">x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}</annotation></semantics>',
		},
		viewportWidth: 300,
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
