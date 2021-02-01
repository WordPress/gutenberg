/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { page } from '@wordpress/icons';

export default function TemplateCard() {
	const { title, description } = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select(
			'core/edit-site'
		);
		const { getEntityRecord } = select( 'core' );
		const { __experimentalGetTemplateInfo: getTemplateInfo } = select(
			'core/editor'
		);

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEntityRecord( 'postType', postType, postId );
		const info = record ? getTemplateInfo( record ) : {};

		return info;
	}, [] );

	return (
		<div className="edit-site-template-card">
			<Icon icon={ page } />
			<div className="edit-site-template-card__content">
				<h2 className="edit-site-template-card__title">{ title }</h2>
				<span className="edit-site-template-card__description">
					{ description }
				</span>
			</div>
		</div>
	);
}
