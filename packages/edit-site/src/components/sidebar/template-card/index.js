/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateAreas from './template-areas';

export default function TemplateCard() {
	const { title, description, icon } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
			editorStore
		);

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEntityRecord( 'postType', postType, postId );
		const info = record ? getTemplateInfo( record ) : {};

		return info;
	}, [] );

	if ( ! title && ! description ) {
		return null;
	}

	return (
		<div className="edit-site-template-card">
			<Icon className="edit-site-template-card__icon" icon={ icon } />
			<div className="edit-site-template-card__content">
				<h2 className="edit-site-template-card__title">{ title }</h2>
				<div className="edit-site-template-card__description">
					{ description }
				</div>

				<TemplateAreas />
			</div>
		</div>
	);
}
