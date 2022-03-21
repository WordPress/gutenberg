/**
 * Internal dependencies
 */
import core__site_tagline from '../../../test/integration/fixtures/blocks/core__site-tagline.serialized.html';

export default {
	title: 'Blocks/core__site_tagline',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__site_tagline } }></div>
	);
};
