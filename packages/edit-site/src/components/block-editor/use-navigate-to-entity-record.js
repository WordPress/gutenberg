/**
 * WordPress dependencies
 */
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useCallback } from '@wordpress/element';
import { addQueryArgs } from '@wordpress/url';
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { useSelect } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );
const { useGenerateBlockPath, saveBlockSelection } =
	unlock( editorPrivateApis );

/**
 * Hook to handle navigation to entity records.
 *
 * @param {string} currentPostType Current post type.
 * @param {number} currentPostId   Current post ID.
 *
 * @return {Function} Function to navigate to an entity record.
 */
export default function useNavigateToEntityRecord(
	currentPostType,
	currentPostId
) {
	const history = useHistory();
	const generateBlockPath = useGenerateBlockPath();
	const getSelectedBlockClientId = useSelect(
		( select ) => select( blockEditorStore ).getSelectedBlockClientId,
		[]
	);

	const onNavigateToEntityRecord = useCallback(
		( params ) => {
			// Save current selection to sessionStorage for restoration on back navigation
			const selectedBlockClientId =
				params.selectedBlockClientId || getSelectedBlockClientId();

			if ( selectedBlockClientId && currentPostType && currentPostId ) {
				const blockPath = generateBlockPath( selectedBlockClientId );
				if ( blockPath ) {
					saveBlockSelection(
						currentPostType,
						currentPostId,
						selectedBlockClientId,
						blockPath
					);
				}
			}

			// Navigate to the new entity record
			const url = addQueryArgs(
				`/${ params.postType }/${ params.postId }`,
				{
					canvas: 'edit',
					focusMode: true,
				}
			);

			history.navigate( url );
		},
		[
			currentPostType,
			currentPostId,
			getSelectedBlockClientId,
			generateBlockPath,
			history,
		]
	);

	return onNavigateToEntityRecord;
}
