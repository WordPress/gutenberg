/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { useMemo, useId } from '@wordpress/element';
import { BlockPreview } from '@wordpress/block-editor';
import { parse } from '@wordpress/blocks';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { patternSyncStatusField } from '@wordpress/fields';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
	OPERATOR_IS,
} from '../../utils/constants';
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

const SYNC_FILTERS = [
	{
		value: PATTERN_SYNC_TYPES.full,
		label: _x( 'Synced', 'pattern (singular)' ),
		description: __( 'Patterns that are kept in sync across the site.' ),
	},
	{
		value: PATTERN_SYNC_TYPES.unsynced,
		label: _x( 'Not synced', 'pattern (singular)' ),
		description: __(
			'Patterns that can be changed freely without affecting the site.'
		),
	},
];

export const patternStatusField = {
	...patternSyncStatusField,
	render: ( { item, field } ) => {
		const SyncStatus = patternSyncStatusField.render;
		const syncStatus = patternSyncStatusField.getValue( {
			item,
			field,
		} );
		return (
			<span
				className={ `edit-site-patterns__field-sync-status-${ syncStatus }` }
			>
				<SyncStatus item={ item } field={ field } />
			</span>
		);
	},
	elements: SYNC_FILTERS,
	filterBy: {
		operators: [ OPERATOR_IS ],
		isPrimary: true,
	},
	enableHiding: true,
	enableSorting: false,
};
