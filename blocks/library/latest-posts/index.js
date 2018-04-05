/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import LatestPostsBlock from './block';

export const name = 'core/latest-posts';

export const settings = {
	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'wide' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: LatestPostsBlock,

	save() {
		return null;
	},
};
