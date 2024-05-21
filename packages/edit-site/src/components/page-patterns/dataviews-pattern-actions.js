/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import {
	PATTERN_TYPES,
	TEMPLATE_PART_POST_TYPE,
	PATTERN_DEFAULT_CATEGORY,
} from '../../utils/constants';
import { CreateTemplatePartModalContents } from '../create-template-part-modal';

const { useHistory, useLocation } = unlock( routerPrivateApis );
const { CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

export const duplicatePatternAction = {
	id: 'duplicate-pattern',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type !== TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate pattern', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const {
			params: { categoryId = PATTERN_DEFAULT_CATEGORY },
		} = useLocation();
		const isThemePattern = item.type === PATTERN_TYPES.theme;
		const history = useHistory();
		function onPatternSuccess( { pattern } ) {
			history.push( {
				categoryType: PATTERN_TYPES.theme,
				categoryId,
				postType: PATTERN_TYPES.user,
				postId: pattern.id,
			} );
			closeModal();
		}
		const duplicatedProps = useDuplicatePatternProps( {
			pattern: isThemePattern ? item : item.patternPost,
			onSuccess: onPatternSuccess,
		} );
		return (
			<CreatePatternModalContents
				onClose={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
				{ ...duplicatedProps }
			/>
		);
	},
};

export const duplicateTemplatePartAction = {
	id: 'duplicate-template-part',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type === TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate template part', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const { createSuccessNotice } = useDispatch( noticesStore );
		const {
			params: { categoryId = PATTERN_DEFAULT_CATEGORY },
		} = useLocation();
		const history = useHistory();
		function onTemplatePartSuccess( templatePart ) {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					item.title
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
			history.push( {
				postType: TEMPLATE_PART_POST_TYPE,
				postId: templatePart?.id,
				categoryType: TEMPLATE_PART_POST_TYPE,
				categoryId,
			} );
			closeModal();
		}
		return (
			<CreateTemplatePartModalContents
				blocks={ item.blocks }
				defaultArea={ item.templatePart.area }
				defaultTitle={ sprintf(
					/* translators: %s: Existing template part title */
					__( '%s (Copy)' ),
					item.title
				) }
				onCreate={ onTemplatePartSuccess }
				onError={ closeModal }
				confirmLabel={ _x( 'Duplicate', 'action label' ) }
			/>
		);
	},
};
