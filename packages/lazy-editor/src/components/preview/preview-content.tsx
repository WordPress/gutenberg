import { __ } from '@wordpress/i18n';
import { useId, useMemo } from '@wordpress/element';
import { BlockPreview } from '@wordpress/block-editor';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { parse } from '@wordpress/blocks';
import { unlock } from '../../lock-unlock';

const { useStyle } = unlock( editorPrivateApis );

export default function PreviewContent( {
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
			parse( content!, {
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
