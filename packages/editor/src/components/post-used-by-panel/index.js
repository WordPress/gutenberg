/**
 * WordPress dependencies
 */
import {
	__experimentalText as Text,
	ExternalLink,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEntityRecords } from '@wordpress/core-data';
import { _n, sprintf } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import {
	TEMPLATE_PART_POST_TYPE,
	TEMPLATE_POST_TYPE,
} from '../../store/constants';
import useTemplatesFilteredByTemplatePart from '../../utils/use-templates-filtered-by-template-part';

function PostUsedByTemplatePartPanel( { templatePartSlug } ) {
	const { records: templates } = useEntityRecords(
		'postType',
		TEMPLATE_POST_TYPE,
		{
			per_page: -1,
		}
	);
	const filteredTemplates = useTemplatesFilteredByTemplatePart(
		templatePartSlug,
		templates
	);
	if ( ! filteredTemplates?.length ) {
		return null;
	}
	return (
		<Text>
			{ createInterpolateElement(
				sprintf(
					/* translators: 1: number of templates. */
					_n(
						'Used by <Link>%1$s template</Link>.',
						'Used by <Link>%1$s templates</Link>.',
						filteredTemplates.length
					),
					filteredTemplates.length
				),
				{
					Link: (
						<ExternalLink
							href={ addQueryArgs( 'site-editor.php', {
								p: '/template',
								usingTemplatePart: templatePartSlug,
							} ) }
						/>
					),
				}
			) }
		</Text>
	);
}

export default function PostUsedByPanel() {
	const { postType, slug } = useSelect( ( select ) => {
		select( editorStore ).getCurrentPostType();
		return {
			postType: select( editorStore ).getCurrentPostType(),
			slug: select( editorStore ).getCurrentPostAttribute( 'slug' ),
		};
	}, [] );
	if ( postType !== TEMPLATE_PART_POST_TYPE ) {
		return null;
	}
	return (
		<div className="editor-post-used-by-panel">
			<PostUsedByTemplatePartPanel templatePartSlug={ slug } />
		</div>
	);
}
