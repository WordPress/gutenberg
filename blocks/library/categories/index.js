/**
 * Internal dependencies
 */
import './editor.scss';
import './style.scss';
import CategoriesBlock from './block';

export const name = 'core/categories';

export const settings = {
	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: CategoriesBlock,

	save() {
		return null;
	},
};
