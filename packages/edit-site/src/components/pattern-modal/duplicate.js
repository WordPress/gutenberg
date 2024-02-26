/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { getQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { PATTERN_MODALS } from './';
import { PATTERN_TYPES } from '../../utils/constants';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';

const { DuplicatePatternModal } = unlock( patternsPrivateApis );
const { useHistory } = unlock( routerPrivateApis );

export default function PatternDuplicateModal() {
	const { record } = useEditedEntityRecord();
	const { categoryType, categoryId } = getQueryArgs( window.location.href );
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
