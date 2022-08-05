/**
 * Internal dependencies
 */
import core__button__squared from '../../../test/integration/fixtures/blocks/core__button__squared.serialized.html';

export default {
	title: 'Blocks/core__button__squared',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__button__squared } }
		></div>
	);
};
