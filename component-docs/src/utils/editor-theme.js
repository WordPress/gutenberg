/**
 * External dependencies
 */
import githubTheme from 'prism-react-renderer/themes/github';

/**
 * Internal dependencies
 */
import { getColor } from './color';

const { plain, styles } = githubTheme;

export default {
	styles,
	plain: {
		...plain,
		backgroundColor: getColor( 'White' ),
	},
};
