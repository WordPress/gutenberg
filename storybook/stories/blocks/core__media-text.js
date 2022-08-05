/**
 * Internal dependencies
 */
import core__media_text from '../../../test/integration/fixtures/blocks/core__media-text.serialized.html';

export default {
	title: 'Blocks/core__media_text',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__media_text } }></div>;
};
