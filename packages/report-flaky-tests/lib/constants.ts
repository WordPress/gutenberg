/**
 * Internal dependencies
 */
import type { MetaData } from './types';

const TEST_RESULTS_LIST = {
	open: `<!-- __TEST_RESULTS_LIST__ -->`,
	close: `<!-- /__TEST_RESULTS_LIST__ -->`,
};
const TEST_RESULT = {
	open: '<!-- __TEST_RESULT__ -->',
	close: '<!-- /__TEST_RESULT__ -->',
};

const metaData = {
	render: ( json: MetaData ) =>
		`<!-- __META_DATA__:${ JSON.stringify( json ) } -->`,
	get: ( str: string ): MetaData | undefined => {
		const matched = str.match( /<!-- __META_DATA__:(.*) -->/ );
		if ( matched ) {
			return JSON.parse( matched[ 1 ] );
		}
		return undefined;
	},
};

export { TEST_RESULTS_LIST, TEST_RESULT, metaData };
