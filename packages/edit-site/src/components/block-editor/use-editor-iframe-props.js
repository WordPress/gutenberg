/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useLocation, useHistory } = unlock( routerPrivateApis );

export default function useEditorIframeProps() {
	const history = useHistory();
	const { query, path } = useLocation();
	const { canvas = 'view' } = query;
	const currentPostIsTrashed = useSelect( ( select ) => {
		return (
			select( editorStore ).getCurrentPostAttribute( 'status' ) ===
			'trash'
		);
	}, [] );

	// In view mode, make the canvas iframe not focusable and omit the title attribute.
	// Todo: the `readonly` variable name could be improved to clarify it's not
	// about the readonly HTML attribute.
	const viewModeIframeProps = {
		tabIndex: -1,
		readonly: true,
		onClick: currentPostIsTrashed
			? null
			: () => {
					history.navigate(
						addQueryArgs( path, { canvas: 'edit' } ),
						{
							transition: 'canvas-mode-edit-transition',
						}
					);
			  },
	};

	return {
		className: 'edit-site-visual-editor__editor-canvas',
		...( canvas === 'view' ? viewModeIframeProps : {} ),
	};
}
