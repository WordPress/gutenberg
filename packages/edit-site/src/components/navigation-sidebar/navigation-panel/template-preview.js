/**
 * WordPress dependencies
 */
import { parse } from '@wordpress/blocks';
import { BlockPreview, BlockContextProvider } from '@wordpress/block-editor';
import { useMemo } from '@wordpress/element';

export default function TemplatePreview( {
	rawContent,
	blockContext,
	...props
} ) {
	const blocks = useMemo( () => ( rawContent ? parse( rawContent ) : [] ), [
		rawContent,
	] );

	if ( ! blocks || blocks.length === 0 ) {
		return null;
	}

	if ( blockContext ) {
		return (
			<div { ...props }>
				<BlockContextProvider value={ blockContext }>
					<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
				</BlockContextProvider>
			</div>
		);
	}

	return (
		<div { ...props }>
			<BlockPreview blocks={ blocks } viewportWidth={ 1200 } />
		</div>
	);
}
