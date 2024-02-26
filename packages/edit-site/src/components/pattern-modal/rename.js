/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { store as interfaceStore } from '@wordpress/interface';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';

/**
 * Internal dependencies
 */
import { PATTERN_MODALS } from './';
import { unlock } from '../../lock-unlock';
import useEditedEntityRecord from '../use-edited-entity-record';

const { RenamePatternModal } = unlock( patternsPrivateApis );

export default function PatternRenameModal() {
	const { record: pattern } = useEditedEntityRecord();
	const { closeModal } = useDispatch( interfaceStore );
	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( PATTERN_MODALS.rename )
	);

	if ( ! isActive ) {
		return null;
	}

	return <RenamePatternModal onClose={ closeModal } pattern={ pattern } />;
}
