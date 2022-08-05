/**
 * Internal dependencies
 */
import core__navigation__deprecated_v4 from '../../../test/integration/fixtures/blocks/core__navigation__deprecated-v4.serialized.html';

export default {
	title: 'Blocks/core__navigation__deprecated_v4',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__navigation__deprecated_v4,
			} }
		></div>
	);
};
