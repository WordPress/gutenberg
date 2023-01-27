/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { Icon } from '@wordpress/components';
import { store as editorStore } from '@wordpress/editor';
import { store as coreStore } from '@wordpress/core-data';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import {
	store as blockEditorStore,
	__experimentalBlockPatternsList as BlockPatternsList,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editSiteStore } from '../../../store';
import TemplateActions from './template-actions';
import TemplateAreas from './template-areas';

const MaybeBlockPatterns = ( { template, blockPatterns, title } ) => {
	if ( template.type !== 'wp_template_part' || blockPatterns?.length === 0 ) {
		return null;
	}

	return (
		<>
			<p>
				{ sprintf(
					// translators: %s: Type of template part (i.e. header, footer, etc.)
					__(
						'Choose a pre-designed pattern to switch up the look and feel of your %s '
					),
					title.toLowerCase()
				) }
			</p>
			<BlockPatternsList
				blockPatterns={ blockPatterns }
				shownPatterns={ blockPatterns }
				onClickPattern={ ( pattern ) => {
					console.log( 'pattern clicked ', pattern );
				} }
			/>
		</>
	);
};
export default function TemplateCard() {
	const {
		info: { title, description, icon },
		template,
		blockPatterns,
	} = useSelect( ( select ) => {
		const { getEditedPostType, getEditedPostId } = select( editSiteStore );
		const { getEditedEntityRecord } = select( coreStore );
		const { __experimentalGetTemplateInfo: getTemplateInfo } =
			select( editorStore );

		const postType = getEditedPostType();
		const postId = getEditedPostId();
		const record = getEditedEntityRecord( 'postType', postType, postId );

		const info = record ? getTemplateInfo( record ) : {};

		const patterns = record?.slug
			? select( blockEditorStore ).getPatternsByBlockTypes(
					`core/template-part/${ record.slug }`
			  )
			: [];

		return { info, template: record, blockPatterns: patterns };
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
				<MaybeBlockPatterns
					template={ template }
					blockPatterns={ blockPatterns }
					title={ title }
				/>
			</div>
		</div>
	);
}
