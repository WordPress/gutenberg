/**
 * Internal dependencies
 */
import core__gallery from '../../../test/integration/fixtures/blocks/core__gallery.serialized.html';

export default {
	title: 'Blocks/core__gallery',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__gallery } }></div>;
};
