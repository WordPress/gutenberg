/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

function TemplatePreview( { item } ) {
	const template = useSelect(
		( select ) => {
			return select( 'core' ).getEntityRecord(
				'postType',
				item.type === 'template' ? 'wp_template' : 'wp_template_part',
				item.id
			);
		},
		[ item ]
	);
	const blocks = useMemo(
		() => ( template ? parse( template?.content?.raw || '' ) : [] ),
		[ template ]
	);
	return (
		<div className="edit-site-template-switcher__template-preview">
			{ !! blocks && (
				<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
			) }
		</div>
	);
}

export default TemplatePreview;
