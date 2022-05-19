/**
 * Internal dependencies
 */
import webTransforms from './transforms.js';
import transformationCategories from '../transformationCategories';

const transforms = {
	...webTransforms,
	supportedMobileTransforms: transformationCategories.other,
};

export default transforms;
