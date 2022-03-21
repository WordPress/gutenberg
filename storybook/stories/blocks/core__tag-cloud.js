/**
 * Internal dependencies
 */
import core__tag_cloud from '../../../test/integration/fixtures/blocks/core__tag-cloud.serialized.html';

export default {
	title: 'Blocks/core__tag_cloud',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__tag_cloud } }></div>;
};
