/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

export default function TemplatePreview( { rawContent } ) {
	const blocks = useMemo( () => ( rawContent ? parse( rawContent ) : [] ), [
		rawContent,
	] );

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	return (
		<div className="edit-site-navigation-panel__preview">
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</div>
	);
}
