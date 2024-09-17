/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import {
	VIEW_AS_LINK_SELECTOR,
	VIEW_AS_PREVIEW_LINK_SELECTOR,
} from '../../store/constants';

/**
 * This listener hook monitors any change in permalink and updates the view
 * post link in the admin bar.
 */
export const useUpdatePostLinkListener = () => {
	const { newPermalink } = useSelect(
		( select ) => ( {
			newPermalink: select( editorStore ).getCurrentPost().link,
		} ),
		[]
	);
	const nodeToUpdateRef = useRef();

	useEffect( () => {
		nodeToUpdateRef.current =
			document.querySelector( VIEW_AS_PREVIEW_LINK_SELECTOR ) ||
			document.querySelector( VIEW_AS_LINK_SELECTOR );
	}, [] );

	useEffect( () => {
		if ( ! newPermalink || ! nodeToUpdateRef.current ) {
			return;
		}
		nodeToUpdateRef.current.setAttribute( 'href', newPermalink );
	}, [ newPermalink ] );
};
