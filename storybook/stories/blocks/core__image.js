/**
 * Internal dependencies
 */
import core__image from '../../../test/integration/fixtures/blocks/core__image.serialized.html';

export default {
	title: 'Blocks/core__image',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__image } }></div>;
};
