/**
 * WordPress dependencies
 */
import { useDispatch } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { useEntityBlockEditor } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { NAVIGATION_POST_KIND, NAVIGATION_POST_POST_TYPE } from '../constants';
import { store as editNavigationStore } from '../store';

export default function useNavigationBlockEditor( post ) {
	const { createMissingMenuItems } = useDispatch( editNavigationStore );

	const [ blocks, onInput, onEntityChange ] = useEntityBlockEditor(
		NAVIGATION_POST_KIND,
		NAVIGATION_POST_POST_TYPE,
		{
			id: post?.id,
		}
	);

	const onChange = useCallback(
		async ( ...args ) => {
			await onEntityChange( ...args );
			createMissingMenuItems( post );
		},
		[ onEntityChange, post ]
	);

	return [ blocks, onInput, onChange ];
}
