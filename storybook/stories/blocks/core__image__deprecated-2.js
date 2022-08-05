/**
 * Internal dependencies
 */
import core__image__deprecated_2 from '../../../test/integration/fixtures/blocks/core__image__deprecated-2.serialized.html';

export default {
	title: 'Blocks/core__image__deprecated_2',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__image__deprecated_2 } }
		></div>
	);
};
