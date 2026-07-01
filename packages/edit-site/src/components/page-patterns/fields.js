/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useMemo, useId } from '@wordpress/element';
import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { TEMPLATE_PART_POST_TYPE } from '../../utils/constants';
import { unlock } from '../../lock-unlock';

const { useStyle } = unlock( editorPrivateApis );

function PreviewField( { item } ) {
	const descriptionId = useId();
	const description = item.description || item?.excerpt?.raw;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const backgroundColor = useStyle( 'color.background' );
	const blocks = useMemo( () => {
		return (
			item.blocks ??
			parse( item.content.raw, {
				__unstableSkipMigrationLogs: true,
			} )
		);
	}, [ item?.content?.raw, item.blocks ] );
	const isEmpty = ! blocks?.length;

	return (
		<div
			className="page-patterns-preview-field"
			style={ { backgroundColor } }
			aria-describedby={ !! description ? descriptionId : undefined }
		>
			{ isEmpty && isTemplatePart && __( 'Empty template part' ) }
			{ isEmpty && ! isTemplatePart && __( 'Empty pattern' ) }
			{ ! isEmpty && (
				<BlockPreview.Async>
					<BlockPreview
						blocks={ blocks }
						viewportWidth={ item.viewportWidth }
					/>
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

export const previewField = {
	label: __( 'Preview' ),
	id: 'preview',
	render: PreviewField,
	enableSorting: false,
};
