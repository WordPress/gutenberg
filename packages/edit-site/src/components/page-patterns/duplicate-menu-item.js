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
	item,
	label = __( 'Duplicate' ),
	onClose,
} ) {
	const { createErrorNotice } = useDispatch( noticesStore );
	const { saveEntityRecord } = useDispatch( coreStore );

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

			await saveEntityRecord(
				'postType',
				'wp_template_part',
				{ slug, title, content, area },
				{ throwOnError: true }
			);

			onClose();
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __(
							'An error occurred while creating the template part.'
					  );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
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

			await saveEntityRecord(
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

			onClose();

			// If this was a theme pattern, we're "copying to my patterns", so
			// we need to navigate to that category to display the new pattern.
			history.push( {
				categoryType: USER_PATTERNS,
				categoryId: USER_PATTERN_CATEGORY,
				path: '/patterns',
			} );
		} catch ( error ) {
			const errorMessage =
				error.message && error.code !== 'unknown_error'
					? error.message
					: __( 'An error occurred while creating the pattern.' );

			createErrorNotice( errorMessage, { type: 'snackbar' } );
			onClose();
		}
	}

	const createItem =
		item.type === TEMPLATE_PARTS ? createTemplatePart : createPattern;

	return <MenuItem onClick={ createItem }>{ label }</MenuItem>;
}
