/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { KIND, POST_TYPE } from '../../store/utils';
import { store as editNavigationStore } from '../../store';

export default function useNavigationBlockEditor( post ) {
	const { createMissingMenuItems } = useDispatch( editNavigationStore );

	const [ blocks, onInput, _onChange ] = useEntityBlockEditor(
		KIND,
		POST_TYPE,
		{ id: post?.id }
	);

	const onChange = useCallback(
		async ( updatedBlocks ) => {
			await _onChange( updatedBlocks );
			createMissingMenuItems( post );
		},
		[ blocks, _onChange ]
	);

	return [ blocks, onInput, onChange ];
}
