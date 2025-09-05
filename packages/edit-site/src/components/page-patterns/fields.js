/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useState, useMemo, useId } from '@wordpress/element';
import {
	BlockPreview,
	privateApis as blockEditorPrivateApis,
} from '@wordpress/block-editor';
import { Icon } from '@wordpress/icons';
import { parse } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
	OPERATOR_IS,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import { useAddedBy } from '../page-templates/hooks';

const { useGlobalStyle } = unlock( blockEditorPrivateApis );

function PreviewField( { item } ) {
	const descriptionId = useId();
	const description = item.description || item?.excerpt?.raw;
	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const [ backgroundColor ] = useGlobalStyle( 'color.background' );
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
	label: __( 'Sync status' ),
	id: 'sync-status',
	render: ( { item } ) => {
		const syncStatus =
			'wp_pattern_sync_status' in item
				? item.wp_pattern_sync_status || PATTERN_SYNC_TYPES.full
				: PATTERN_SYNC_TYPES.unsynced;
		// User patterns can have their sync statuses checked directly.
		// Non-user patterns are all unsynced for the time being.
		return (
			<span
				className={ `edit-site-patterns__field-sync-status-${ syncStatus }` }
			>
				{
					SYNC_FILTERS.find( ( { value } ) => value === syncStatus )
						.label
				}
			</span>
		);
	},
	elements: SYNC_FILTERS,
	filterBy: {
		operators: [ OPERATOR_IS ],
		isPrimary: true,
	},
	enableSorting: false,
};

function AuthorField( { item } ) {
	const [ isImageLoaded, setIsImageLoaded ] = useState( false );
	const { text, icon, imageUrl } = useAddedBy( item.type, item.id );

	return (
		<HStack alignment="left" spacing={ 0 }>
			{ imageUrl && (
				<div
					className={ clsx( 'page-templates-author-field__avatar', {
						'is-loaded': isImageLoaded,
					} ) }
				>
					<img
						onLoad={ () => setIsImageLoaded( true ) }
						alt=""
						src={ imageUrl }
					/>
				</div>
			) }
			{ ! imageUrl && (
				<div className="page-templates-author-field__icon">
					<Icon icon={ icon } />
				</div>
			) }
			<span className="page-templates-author-field__name">{ text }</span>
		</HStack>
	);
}

export const templatePartAuthorField = {
	label: __( 'Author' ),
	id: 'author',
	getValue: ( { item } ) => item.author_text,
	render: AuthorField,
	filterBy: {
		isPrimary: true,
	},
};
