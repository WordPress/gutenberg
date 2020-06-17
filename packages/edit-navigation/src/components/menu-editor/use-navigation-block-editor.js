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

export default function useNavigationBlockEditor( post ) {
	const { createMissingMenuItems } = useDispatch( 'core/edit-navigation' );

	const [ blocks, onInput, _onChange ] = useEntityBlockEditor(
		KIND,
		POST_TYPE,
		{ id: post.id }
	);
	const onChange = useCallback(
		( updatedBlocks ) => {
			async function handle() {
				await _onChange( updatedBlocks );
				createMissingMenuItems( post );
			}
			handle();
		},
		[ blocks, onChange ]
	);

	return [ blocks, onInput, onChange ];
}
