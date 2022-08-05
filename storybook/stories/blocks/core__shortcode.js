/**
 * Internal dependencies
 */
import core__shortcode from '../../../test/integration/fixtures/blocks/core__shortcode.serialized.html';

export default {
	title: 'Blocks/core__shortcode',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__shortcode } }></div>;
};
