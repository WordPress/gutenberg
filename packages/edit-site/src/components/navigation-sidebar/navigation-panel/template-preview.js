/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { BlockPreview, BlockContextProvider } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

export default function TemplatePreview( { rawContent, blockContext } ) {
	const blocks = useMemo( () => ( rawContent ? parse( rawContent ) : [] ), [
		rawContent,
	] );

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	if ( blockContext ) {
		return (
			<div className="edit-site-navigation-panel__preview">
				<BlockContextProvider value={ blockContext }>
					<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
				</BlockContextProvider>
			</div>
		);
	}

	return (
		<div className="edit-site-navigation-panel__preview">
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</div>
	);
}
