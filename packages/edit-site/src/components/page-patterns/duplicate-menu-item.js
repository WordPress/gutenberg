/**
 * WordPress dependencies
 */
import { MenuItem } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { privateApis as routerPrivateApis } from '@wordpress/router';

/**
 * Internal dependencies
 */
import {
	TEMPLATE_PART_POST_TYPE,
	PATTERN_SYNC_TYPES,
	PATTERN_TYPES,
} from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import CreateTemplatePartModal from '../create-template-part-modal';

const { CreatePatternModal } = unlock( patternsPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

export default function DuplicateMenuItem( {
	categoryId,
	item,
	label = __( 'Duplicate' ),
	onClose,
} ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const history = useHistory();

	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;

	async function onTemplatePartSuccess( templatePart ) {
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
			postId: templatePart?.id,
			categoryType: TEMPLATE_PART_POST_TYPE,
			categoryId,
		} );

		onClose();
	}

	function onPatternSuccess( { pattern } ) {
		createSuccessNotice(
			sprintf(
				// translators: %s: The new pattern's title e.g. 'Call to action (copy)'.
				__( '"%s" duplicated.' ),
				pattern.title.raw
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
			postId: pattern.id,
		} );

		onClose();
	}

	const isThemePattern = item.type === PATTERN_TYPES.theme;
	const closeModal = () => setIsModalOpen( false );
	const duplicatedProps = isTemplatePart
		? {
				blocks: item.blocks,
				defaultArea: item.templatePart.area,
				defaultTitle: sprintf(
					/* translators: %s: Existing template part title */
					__( '%s (Copy)' ),
					item.title
				),
		  }
		: {
				defaultCategories: isThemePattern
					? item.categories
					: item.termLabels,
				content: isThemePattern
					? item.content
					: item.patternBlock.content,
				defaultSyncType: isThemePattern
					? PATTERN_SYNC_TYPES.unsynced
					: item.syncStatus,
				defaultTitle: sprintf(
					/* translators: %s: Existing pattern title */
					__( '%s (Copy)' ),
					item.title || item.name
				),
		  };

	return (
		<>
			<MenuItem
				onClick={ () => setIsModalOpen( true ) }
				aria-expanded={ isModalOpen }
				aria-haspopup="dialog"
			>
				{ label }
			</MenuItem>
			{ isModalOpen && ! isTemplatePart && (
				<CreatePatternModal
					confirmLabel={ __( 'Duplicate' ) }
					modalTitle={ __( 'Duplicate pattern' ) }
					onClose={ closeModal }
					onError={ closeModal }
					onSuccess={ onPatternSuccess }
					{ ...duplicatedProps }
				/>
			) }
			{ isModalOpen && isTemplatePart && (
				<CreateTemplatePartModal
					confirmLabel={ __( 'Duplicate' ) }
					closeModal={ closeModal }
					modalTitle={ __( 'Duplicate template part' ) }
					onCreate={ onTemplatePartSuccess }
					onError={ closeModal }
					{ ...duplicatedProps }
				/>
			) }
		</>
	);
}
