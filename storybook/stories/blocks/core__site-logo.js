/**
 * Internal dependencies
 */
import core__site_logo from '../../../test/integration/fixtures/blocks/core__site-logo.serialized.html';

export default {
	title: 'Blocks/core__site_logo',
};

export const _default = () => {
	return <div dangerouslySetInnerHTML={ { __html: core__site_logo } }></div>;
};
