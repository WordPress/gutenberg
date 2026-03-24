/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { useEditorSettings } from '@wordpress/lazy-editor';

const noop = () => {};

function Canvas() {
	const globalStylesId = useSelect(
		( select ) =>
			(
				select( coreStore ) as any
			).__experimentalGetCurrentGlobalStylesId(),
		[]
	);
	const { editorSettings } = useEditorSettings( {
		stylesId: globalStylesId,
	} );

	const blocks = useMemo(
		() => [
			createBlock( 'core/site-logo' ),
			createBlock( 'core/site-title' ),
			createBlock( 'core/site-tagline' ),
		],
		[]
	);

	return (
		<BlockEditorProvider
			settings={ editorSettings }
			value={ blocks }
			onChange={ noop }
			onInput={ noop }
		>
			<BlockList />
		</BlockEditorProvider>
	);
}

export const canvas = Canvas;
