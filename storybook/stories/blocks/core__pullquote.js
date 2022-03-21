/**
 * Internal dependencies
 */
import core__pullquote from '../../../test/integration/fixtures/blocks/core__pullquote.serialized.html';

export default {
	title: 'Blocks/core__pullquote',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__pullquote } }></div>;
};
