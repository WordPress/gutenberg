/**
 * Internal dependencies
 */
import core__site_tagline__deprecated_v1 from '../../../test/integration/fixtures/blocks/core__site-tagline__deprecated-v1.serialized.html';

export default {
	title: 'Blocks/core__site_tagline__deprecated_v1',
};

export const _default = () => {
	return (
		<div
			dangerouslySetInnerHTML={ {
				__html: core__site_tagline__deprecated_v1,
			} }
		></div>
	);
};
