/**
 * Internal dependencies
 */
import core__button__deprecated_v10 from '../../../test/integration/fixtures/blocks/core__button__deprecated-v10.serialized.html';

export default {
	title: 'Blocks/core__button__deprecated_v10',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__button__deprecated_v10 } }
		></div>
	);
};
