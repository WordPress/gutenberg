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
	TEMPLATE_PARTS,
	PATTERNS,
	SYNC_TYPES,
	USER_PATTERNS,
	USER_PATTERN_CATEGORY,
} from './utils';
import {
	useExistingTemplateParts,
	getUniqueTemplatePartTitle,
	getCleanTemplatePartSlug,
} from '../../utils/template-part-create';
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

export default function DuplicateMenuItem( {
	categoryId,
	item,
	label = __( 'Duplicate' ),
	onClose,
} ) {
	const { saveEntityRecord } = useDispatch( coreStore );
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );

	const history = useHistory();
	const existingTemplateParts = useExistingTemplateParts();

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
				'wp_template_part',
				{ slug, title, content, area },
				{ throwOnError: true }
			);

			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( "'%s' created." ),
					title
				),
				{
					type: 'snackbar',
					id: 'edit-site-patterns-success',
					actions: [
						{
							label: __( 'Edit template part' ),
							onClick: () =>
								history.push( {
									postType: TEMPLATE_PARTS,
									postId: result?.id,
									categoryType: TEMPLATE_PARTS,
									categoryId,
								} ),
						},
					],
				}
			);

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

	async function createPattern() {
		try {
			const isThemePattern = item.type === PATTERNS;
			const title = sprintf(
				/* translators: %s: Existing pattern title */
				__( '%s (Copy)' ),
				item.title
			);

			const result = await saveEntityRecord(
				'postType',
				'wp_block',
				{
					content: isThemePattern
						? item.content
						: item.reusableBlock.content,
					meta: isThemePattern
						? { sync_status: SYNC_TYPES.unsynced }
						: item.reusableBlock.meta,
					status: 'publish',
					title,
				},
				{ throwOnError: true }
			);

			const actionLabel = isThemePattern
				? __( 'View my patterns' )
				: __( 'Edit pattern' );

			const newLocation = isThemePattern
				? {
						categoryType: USER_PATTERNS,
						categoryId: USER_PATTERN_CATEGORY,
						path: '/patterns',
				  }
				: {
						categoryType: USER_PATTERNS,
						categoryId: USER_PATTERN_CATEGORY,
						postType: USER_PATTERNS,
						postId: result?.id,
				  };

			createSuccessNotice(
				sprintf(
					// translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
					__( "'%s' added to my patterns." ),
					title
				),
				{
					type: 'snackbar',
					id: 'edit-site-patterns-success',
					actions: [
						{
							label: actionLabel,
							onClick: () => history.push( newLocation ),
						},
					],
				}
			);

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
		item.type === TEMPLATE_PARTS ? createTemplatePart : createPattern;

	return <MenuItem onClick={ createItem }>{ label }</MenuItem>;
}
