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
import { TEMPLATE_PART_POST_TYPE, PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import CreateTemplatePartModal from '../create-template-part-modal';

const { DuplicatePatternModal } = unlock( patternsPrivateApis );
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

	const closeModal = () => setIsModalOpen( false );

	const isTemplatePart = item.type === TEMPLATE_PART_POST_TYPE;
	const isThemePattern = item.type === PATTERN_TYPES.theme;

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
		history.push( {
			categoryType: PATTERN_TYPES.theme,
			categoryId,
			postType: PATTERN_TYPES.user,
			postId: pattern.id,
		} );

		onClose();
	}

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
				<DuplicatePatternModal
					onClose={ closeModal }
					onSuccess={ onPatternSuccess }
					pattern={ isThemePattern ? item : item.patternBlock }
				/>
			) }
			{ isModalOpen && isTemplatePart && (
				<CreateTemplatePartModal
					blocks={ item.blocks }
					closeModal={ closeModal }
					confirmLabel={ __( 'Duplicate' ) }
					defaultArea={ item.templatePart.area }
					defaultTitle={ sprintf(
						/* translators: %s: Existing template part title */
						__( '%s (Copy)' ),
						item.title
					) }
					modalTitle={ __( 'Duplicate template part' ) }
					onCreate={ onTemplatePartSuccess }
					onError={ closeModal }
				/>
			) }
		</>
	);
}
