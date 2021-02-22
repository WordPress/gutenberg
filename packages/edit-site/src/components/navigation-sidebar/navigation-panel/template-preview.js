/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { BlockPreview } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';
import { EntityProvider } from '@wordpress/core-data';

export default function TemplatePreview( { rawContent, provideEntity } ) {
	const blocks = useMemo( () => ( rawContent ? parse( rawContent ) : [] ), [
		rawContent,
	] );

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	if ( provideEntity ) {
		return (
			<div className="edit-site-navigation-panel__preview">
				<EntityProvider
					kind="postType"
					type={ provideEntity.type }
					id={ provideEntity.id }
				>
					<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
				</EntityProvider>
			</div>
		);
	}

	return (
		<div className="edit-site-navigation-panel__preview">
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</div>
	);
}
