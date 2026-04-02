/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { privateApis as patternsPrivateApis } from '@wordpress/patterns';
import { store as coreStore } from '@wordpress/core-data';
import { store as interfaceStore } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';
import { PATTERN_POST_TYPE } from '../../store/constants';

const { RenamePatternModal } = unlock( patternsPrivateApis );
export const modalName = 'editor/pattern-rename';

export default function PatternRenameModal() {
	const isActive = useSelect( ( select ) =>
		select( interfaceStore ).isModalActive( modalName )
	);

	const { record, postType } = useSelect(
		( select ) => {
			if ( ! isActive ) {
				return {};
			}

			const { getCurrentPostType, getCurrentPostId } =
				select( editorStore );
			const { getEditedEntityRecord } = select( coreStore );
			const _postType = getCurrentPostType();
			return {
				record: getEditedEntityRecord(
					'postType',
					_postType,
					getCurrentPostId()
				),
				postType: _postType,
			};
		},
		[ isActive ]
	);

	const { closeModal } = useDispatch( interfaceStore );

	if ( ! isActive || postType !== PATTERN_POST_TYPE ) {
		return null;
	}

	return <RenamePatternModal onClose={ closeModal } pattern={ record } />;
}
