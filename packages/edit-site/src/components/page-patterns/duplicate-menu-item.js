/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_POST_TYPE,
	PATTERN_TYPES,
	PATTERN_SYNC_TYPES,
} from '../../utils/constants';
import {
	useExistingTemplateParts,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from '../../utils/template-part-create';
import { unlock } from '../../lock-unlock';
import usePatternCategories from '../sidebar-navigation-screen-patterns/use-pattern-categories';

const { useHistory } = unlock( routerPrivateApis );

function getPatternMeta( item ) {
	if ( item.type === PATTERN_TYPES.theme ) {
		return { wp_pattern_sync_status: PATTERN_SYNC_TYPES.unsynced };
	}

	const syncStatus = item.patternBlock.wp_pattern_sync_status;
	const isUnsynced = syncStatus === PATTERN_SYNC_TYPES.unsynced;

	return {
		...item.patternBlock.meta,
		wp_pattern_sync_status: isUnsynced ? syncStatus : undefined,
	};
}

export default function DuplicateMenuItem( {
	categoryId,
	item,
	label = __( 'Duplicate' ),
	onClose,
} ) {
	const { saveEntityRecord, invalidateResolution } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const history = useHistory();
	const existingTemplateParts = useExistingTemplateParts();
	const { patternCategories } = usePatternCategories();

	async function createTemplatePart() {
		try {
			const copiedTitle = sprintf(
				/* translators: %s: Existing template part title */
				__( '%s (Copy)' ),
				item.title
			);
			const title = getUniqueTemplatePartTitle(
				copiedTitle,
				existingTemplateParts
			);
			const slug = getCleanTemplatePartSlug( title );
			const { area, content } = item.templatePart;

			const result = await saveEntityRecord(
				'postType',
				TEMPLATE_PART_POST_TYPE,
				{ slug, title, content, area },
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					item.title
				),
				{
					type: 'snackbar',
					id: 'edit-site-patterns-success',
				}
			);

			history.push( {
				postType: TEMPLATE_PART_POST_TYPE,
				postId: result?.id,
				categoryType: TEMPLATE_PART_POST_TYPE,
				categoryId,
			} );

			onClose();
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the template part.'
					  );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
				id: 'edit-site-patterns-error',
			} );
			onClose();
		}
	}

	async function findOrCreateTerm( term ) {
		try {
			const newTerm = await saveEntityRecord(
				'taxonomy',
				'wp_pattern_category',
				{
					name: term.label,
					slug: term.name,
					description: term.description,
				},
				{
					throwOnError: true,
				}
			);
			invalidateResolution( 'getUserPatternCategories' );
			return newTerm.id;
		} catch ( error ) {
			if ( error.code !== 'term_exists' ) {
				throw error;
			}

			return error.data.term_id;
		}
	}

	async function getCategories( categories ) {
		const terms = categories.map( ( category ) => {
			const fullCategory = patternCategories.find(
				( cat ) => cat.name === category
			);
			if ( fullCategory.id ) {
				return fullCategory.id;
			}
			return findOrCreateTerm( fullCategory );
		} );

		return Promise.all( terms );
	}

	async function createPattern() {
		try {
			const isThemePattern = item.type === PATTERN_TYPES.theme;
			const title = sprintf(
				/* translators: %s: Existing pattern title */
				__( '%s (Copy)' ),
				item.title
			);
			const categories = await getCategories( item.categories );

			const result = await saveEntityRecord(
				'postType',
				PATTERN_TYPES.user,
				{
					content: isThemePattern
						? item.content
						: item.patternBlock.content,
					meta: getPatternMeta( item ),
					status: 'publish',
					title,
					wp_pattern_category: categories,
				},
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					// translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					item.title
				),
				{
					type: 'snackbar',
					id: 'edit-site-patterns-success',
				}
			);

			history.push( {
				categoryType: PATTERN_TYPES.theme,
				categoryId,
				postType: PATTERN_TYPES.user,
				postId: result?.id,
			} );

			onClose();
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the pattern.' );

			createErrorNotice( errorMessage, {
				type: 'snackbar',
				id: 'edit-site-patterns-error',
			} );
			onClose();
		}
	}

	const createItem =
		item.type === TEMPLATE_PART_POST_TYPE
			? createTemplatePart
			: createPattern;

	return <MenuItem onClick={ createItem }>{ label }</MenuItem>;
}
