/**
 * Internal dependencies
 */
import core__embed from '../../../test/integration/fixtures/blocks/core__embed.serialized.html';

export default {
	title: 'Blocks/core__embed',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__embed } }></div>;
};
