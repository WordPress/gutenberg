/**
 * Internal dependencies
 */
import core__navigation__deprecated_1 from '../../../test/integration/fixtures/blocks/core__navigation__deprecated-1.serialized.html';

export default {
	title: 'Blocks/core__navigation__deprecated_1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__navigation__deprecated_1,
			} }
		></div>
	);
};
