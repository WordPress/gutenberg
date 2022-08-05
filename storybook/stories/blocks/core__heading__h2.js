/**
 * Internal dependencies
 */
import core__heading__h2 from '../../../test/integration/fixtures/blocks/core__heading__h2.serialized.html';

export default {
	title: 'Blocks/core__heading__h2',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__heading__h2 } }></div>
	);
};
