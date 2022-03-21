/**
 * Internal dependencies
 */
import core__post_template from '../../../test/integration/fixtures/blocks/core__post-template.serialized.html';

export default {
	title: 'Blocks/core__post_template',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__post_template } }></div>
	);
};
