/**
 * Internal dependencies
 */
import core__button__center__deprecated from '../../../test/integration/fixtures/blocks/core__button__center__deprecated.serialized.html';

export default {
	title: 'Blocks/core__button__center__deprecated',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__button__center__deprecated,
			} }
		></div>
	);
};
