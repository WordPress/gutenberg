/**
 * Internal dependencies
 */
import core__social_links from '../../../test/integration/fixtures/blocks/core__social-links.serialized.html';

export default {
	title: 'Blocks/core__social_links',
};

export const _default = () => {
	return (
		<div dangerouslySetInnerHTML={ { __html: core__social_links } }></div>
	);
};
