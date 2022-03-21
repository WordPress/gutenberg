/**
 * Internal dependencies
 */
import core__heading__h4_em from '../../../test/integration/fixtures/blocks/core__heading__h4-em.serialized.html';

export default {
	title: 'Blocks/core__heading__h4_em',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__heading__h4_em } }></div>
	);
};
