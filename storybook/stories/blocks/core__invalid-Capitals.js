/**
 * Internal dependencies
 */
import core__invalid_Capitals from '../../../test/integration/fixtures/blocks/core__invalid-Capitals.serialized.html';

export default {
	title: 'Blocks/core__invalid_Capitals',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ { __html: core__invalid_Capitals } }
		></div>
	);
};
