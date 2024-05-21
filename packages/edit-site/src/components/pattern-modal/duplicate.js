/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { privateApis as editorPrivateApis } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { PATTERN_MODALS } from './';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';

const { DuplicatePatternModal } = unlock( patternsPrivateApis );
const { interfaceStore } = unlock( editorPrivateApis );

export default function PatternDuplicateModal() {
	const { record } = useEditedEntityRecord();
	const { closeModal } = useDispatch( interfaceStore );

	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( PATTERN_MODALS.duplicate )
	);

	if ( ! isActive ) {
		return null;
	}

	return (
		<DuplicatePatternModal
			onClose={ closeModal }
			onSuccess={ () => closeModal() }
			pattern={ record }
		/>
	);
}
