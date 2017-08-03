/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import TagsSelector from './tags-selector';
import CategoriesSelector from './categories-selector';

function PostTaxonomies() {
	return (
		<PanelBody title={ __( 'Categories & Tags' ) } initialOpen={ false }>
			<CategoriesSelector />
			<TagsSelector />
		</PanelBody>
	);
}

export default PostTaxonomies;

