/**
 * Internal dependencies
 */
import core__home_link from '../../../test/integration/fixtures/blocks/core__home-link.serialized.html';

export default {
	title: 'Blocks/core__home_link',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__home_link } }></div>;
};
