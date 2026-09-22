import { createRequire } from 'module';

const require = createRequire( import.meta.url );

export default {
	extends: require.resolve( '@wordpress/stylelint-tools/config' ),
};
