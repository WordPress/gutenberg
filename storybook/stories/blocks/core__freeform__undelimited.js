/**
 * Internal dependencies
 */
import core__freeform__undelimited from '../../../test/integration/fixtures/blocks/core__freeform__undelimited.serialized.html';

export default {
	title: 'Blocks/core__freeform__undelimited',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__freeform__undelimited } }
		></div>
	);
};
