/**
 * Internal dependencies
 */
import core__preformatted from '../../../test/integration/fixtures/blocks/core__preformatted.serialized.html';

export default {
	title: 'Blocks/core__preformatted',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__preformatted } }></div>
	);
};
