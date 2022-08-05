/**
 * Internal dependencies
 */
import core__cover from '../../../test/integration/fixtures/blocks/core__cover.serialized.html';

export default {
	title: 'Blocks/core__cover',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__cover } }></div>;
};
