/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';

export default function TemplateCard() {
	const {
		info: { title, description, icon },
		template,
	} = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEditedEntityRecord( 'postType', postType, postId );

		const info = record ? getTemplateInfo( record ) : {};

		return { info, template: record };
	}, [] );

	if ( ! title && ! description ) {
		return null;
	}

	return (
		<div className="edit-site-template-card">
			<Icon className="edit-site-template-card__icon" icon={ icon } />
			<div className="edit-site-template-card__content">
				<div className="edit-site-template-card__header">
					<h2 className="edit-site-template-card__title">
						{ decodeEntities( title ) }
					</h2>
					<TemplateActions template={ template } />
				</div>
				<div className="edit-site-template-card__description">
					{ decodeEntities( description ) }
				</div>
				<TemplateAreas />
			</div>
		</div>
	);
}
