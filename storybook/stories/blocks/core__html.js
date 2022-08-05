/**
 * Internal dependencies
 */
import core__html from '../../../test/integration/fixtures/blocks/core__html.serialized.html';

export default {
	title: 'Blocks/core__html',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__html } }></div>;
};
