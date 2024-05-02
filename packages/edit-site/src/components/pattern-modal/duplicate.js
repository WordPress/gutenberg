/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { PATTERN_MODALS } from './';
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';

const { DuplicatePatternModal } = unlock( patternsPrivateApis );
const { useHistory, useLocation } = unlock( routerPrivateApis );
const { interfaceStore } = unlock( editorPrivateApis );

export default function PatternDuplicateModal() {
	const { record } = useEditedEntityRecord();
	const {
		params: { categoryType, categoryId },
	} = useLocation();
	const { closeModal } = useDispatch( interfaceStore );
	const history = useHistory();

	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( PATTERN_MODALS.duplicate )
	);

	if ( ! isActive ) {
		return null;
	}

	function onSuccess( { pattern: newPattern } ) {
		history.push( {
			categoryType,
			categoryId,
			postType: PATTERN_TYPES.user,
			postId: newPattern.id,
		} );

		closeModal();
	}

	return (
		<DuplicatePatternModal
			onClose={ closeModal }
			onSuccess={ onSuccess }
			pattern={ record }
		/>
	);
}
