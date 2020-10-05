/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { useSelect } from '@wordpress/data';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

export default function TemplatePreview( { entityType, entityId } ) {
	const template = useSelect(
		( select ) =>
			select( 'core' ).getEntityRecord(
				'postType',
				entityType,
				entityId
			),
		[ entityId ]
	);

	const templateRawContent = template?.content?.raw || '';
	const blocks = useMemo(
		() => ( template ? parse( templateRawContent ) : [] ),
		[ templateRawContent ]
	);

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	return (
		<div className="edit-site-navigation-panel__preview">
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</div>
	);
}
