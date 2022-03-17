/**
 * Internal dependencies
 */
import core__template_part from '../../../test/integration/fixtures/blocks/core__template-part.serialized.html';

export default {
	title: 'Blocks/core__template_part',
};

export const _default = () => return <div dangerouslySetInnerHTML={ { __html: core__template_part } }></div>;