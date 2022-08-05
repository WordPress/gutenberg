/**
 * Internal dependencies
 */
import core__site_title from '../../../test/integration/fixtures/blocks/core__site-title.serialized.html';

export default {
	title: 'Blocks/core__site_title',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__site_title } }></div>;
};
