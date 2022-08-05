/**
 * Internal dependencies
 */
import core__rss from '../../../test/integration/fixtures/blocks/core__rss.serialized.html';

export default {
	title: 'Blocks/core__rss',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__rss } }></div>;
};
