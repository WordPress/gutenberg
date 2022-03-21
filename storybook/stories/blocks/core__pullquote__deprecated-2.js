/**
 * Internal dependencies
 */
import core__pullquote__deprecated_2 from '../../../test/integration/fixtures/blocks/core__pullquote__deprecated-2.serialized.html';

export default {
	title: 'Blocks/core__pullquote__deprecated_2',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__pullquote__deprecated_2,
			} }
		></div>
	);
};
