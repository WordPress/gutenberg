import { lazy, Suspense, useMemo } from '@wordpress/element';
import { BlockEditorProvider } from '@wordpress/block-editor';
import './style.scss';
import { useEditorAssets } from '../../hooks/use-editor-assets';
import { useEditorSettings } from '../../hooks/use-editor-settings';
import { useStylesId } from '../../hooks/use-styles-id';

// Reads `wp.editor` when it loads, so it is loaded once the editor assets are.
const PreviewContent = lazy( () => import( './preview-content' ) );

export function Preview( {
	blocks,
	content,
	description,
}: {
	blocks?: any[];
	content?: string;
	description: string;
} ) {
	// Resolve styles ID from template
	const stylesId = useStylesId();

	// Load editor settings and assets
	const { isReady: settingsReady, editorSettings } = useEditorSettings( {
		stylesId,
	} );
	const { isReady: assetsReady } = useEditorAssets();
	const finalSettings = useMemo(
		() => ( {
			...editorSettings,
			isPreviewMode: true,
		} ),
		[ editorSettings ]
	);
	if ( ! settingsReady || ! assetsReady ) {
		return null;
	}
	return (
		<BlockEditorProvider settings={ finalSettings }>
			<Suspense fallback={ null }>
				<PreviewContent
					blocks={ blocks }
					content={ content }
					description={ description }
				/>
			</Suspense>
		</BlockEditorProvider>
	);
}
