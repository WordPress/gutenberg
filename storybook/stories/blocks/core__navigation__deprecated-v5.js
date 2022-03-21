/**
 * Internal dependencies
 */
import core__navigation__deprecated_v5 from '../../../test/integration/fixtures/blocks/core__navigation__deprecated-v5.serialized.html';

export default {
	title: 'Blocks/core__navigation__deprecated_v5',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__navigation__deprecated_v5,
			} }
		></div>
	);
};
