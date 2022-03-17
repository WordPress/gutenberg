/**
 * Internal dependencies
 */
import paragraph from '../../../test/integration/fixtures/blocks/core__paragraph__deprecated.serialized.html';

export default {
	title: 'Blocks/Paragraph',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: paragraph } }></div>;
};
