/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';

import { useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { PATTERN_TYPES, TEMPLATE_PART_POST_TYPE } from '../../utils/constants';
import { CreateTemplatePartModalContents } from '../create-template-part-modal';

const { CreatePatternModalContents, useDuplicatePatternProps } =
	unlock( patternsPrivateApis );

export const duplicatePatternAction = {
	id: 'duplicate-pattern',
	label: _x( 'Duplicate', 'action label' ),
	isEligible: ( item ) => item.type !== TEMPLATE_PART_POST_TYPE,
	modalHeader: _x( 'Duplicate pattern', 'action label' ),
	RenderModal: ( { items, closeModal } ) => {
		const [ item ] = items;
		const isThemePattern = item.type === PATTERN_TYPES.theme;
		const duplicatedProps = useDuplicatePatternProps( {
			pattern: isThemePattern ? item : item.patternPost,
			onSuccess: () => closeModal(),
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
		function onTemplatePartSuccess() {
			createSuccessNotice(
				sprintf(
					// translators: %s: The new template part's title e.g. 'Call to action (copy)'.
					__( '"%s" duplicated.' ),
					item.title
				),
				{ type: 'snackbar', id: 'edit-site-patterns-success' }
			);
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
