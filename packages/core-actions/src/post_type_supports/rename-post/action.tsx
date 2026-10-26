import { __ } from '@wordpress/i18n';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { unlock } from '../../lock-unlock';
import {
	getItemTitle,
	isTemplateRemovable,
	isTemplate,
	isTemplatePart,
} from '../../shared/utils';
import { createAbilityAction } from '../../shared/ability-action';
import { RENAME_POST_ABILITY } from '../../shared/abilities';
import type {
	PostWithPermissions,
	ActionScriptParts,
} from '../../shared/types';

// Patterns.
const { PATTERN_TYPES } = unlock( patternsPrivateApis );

const renamePost: ActionScriptParts< PostWithPermissions > = {
	isEligible( post ) {
		if ( post.status === 'trash' ) {
			return false;
		}

		// Templates, template parts and patterns have special checks for renaming.
		if ( ! [ 'wp_template', 'wp_template_part' ].includes( post.type ) ) {
			return post.permissions?.update;
		}

		// In the case of templates, we can only rename custom templates.
		if ( isTemplate( post ) ) {
			return (
				isTemplateRemovable( post ) &&
				post.is_custom &&
				post.permissions?.update
			);
		}

		if ( isTemplatePart( post ) ) {
			return (
				post.source === 'custom' &&
				! post?.has_theme_file &&
				post.permissions?.update
			);
		}

		return post.type === PATTERN_TYPES.user && post.permissions?.update;
	},
	...createAbilityAction< PostWithPermissions >( {
		ability: RENAME_POST_ABILITY,
		// The title is not provided, so the modal asks for it.
		getInput: ( [ item ] ) => ( { post_type: item.type, id: item.id } ),
		getInitialValues: ( [ item ] ) => ( {
			title: getItemTitle( item, '' ),
		} ),
		submitLabel: __( 'Save' ),
		getSuccessMessage: () => __( 'Name updated' ),
		fallbackErrorMessage: __( 'An error occurred while updating the name' ),
	} ),
};

/**
 * The JavaScript parts of the rename action for PostWithPermissions; its data
 * is in `action.php`.
 */
export default renamePost;
