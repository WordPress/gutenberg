import type { CollaboratorInfo } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

/**
 * Return a collaborator name localized for the current viewer.
 *
 * Fallback names are stored untranslated in shared awareness state so peers
 * with different profile languages do not receive another user's translation.
 *
 * @param collaboratorInfo Collaborator information from awareness state.
 * @return The collaborator name to display.
 */
export function getCollaboratorDisplayName(
	collaboratorInfo: Pick< CollaboratorInfo, 'id' | 'name' >
): string {
	return null === collaboratorInfo.id
		? __( 'Anonymous User' )
		: collaboratorInfo.name;
}
