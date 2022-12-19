/**
 * Internal dependencies
 */
import webTransforms from './transforms.js';
import transformationCategories from '../utils/transformation-categories';

const transforms = {
	...webTransforms,
	supportedMobileTransforms: transformationCategories.other,
};

export default transforms;
