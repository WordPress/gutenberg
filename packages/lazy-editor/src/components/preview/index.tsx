/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useId, useMemo } from '@wordpress/element';
// @ts-expect-error Block Editor not fully typed yet.
import { BlockPreview, BlockEditorProvider } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
// @ts-expect-error Blocks not fully typed yet.
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import './style.scss';
import { unlock } from '../../lock-unlock';
import { useEditorAssets } from '../../hooks/use-editor-assets';
import { useEditorSettings } from '../../hooks/use-editor-settings';
import { useStylesId } from '../../hooks/use-styles-id';

const { useStyle } = unlock( editorPrivateApis );

function PreviewContent( {
	blocks,
	content,
	description,
}: {
	blocks?: any[];
	content?: string;
	description: string;
} ) {
	const descriptionId = useId();
	const backgroundColor = useStyle( 'color.background' );
	const actualBlocks = useMemo( () => {
		return (
			blocks ??
			parse( content, {
				__unstableSkipMigrationLogs: true,
			} )
		);
	}, [ content, blocks ] );
	const isEmpty = ! actualBlocks?.length;

	return (
		<div
			className="lazy-editor-block-preview__container"
			style={ { backgroundColor } }
			aria-describedby={ !! description ? descriptionId : undefined }
		>
			{ isEmpty && __( 'Empty.' ) }
			{ ! isEmpty && (
				<BlockPreview.Async>
					<BlockPreview blocks={ actualBlocks } />
				</BlockPreview.Async>
			) }
			{ !! description && (
				<div hidden id={ descriptionId }>
					{ description }
				</div>
			) }
		</div>
	);
}

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
			<PreviewContent
				blocks={ blocks }
				content={ content }
				description={ description }
			/>
		</BlockEditorProvider>
	);
}
