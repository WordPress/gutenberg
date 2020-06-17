/**
 * WordPress dependencies
 */
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
} from '@wordpress/block-editor';
import { useViewportMatch } from '@wordpress/compose';
import { Spinner } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MenuEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';
import useNavigationBlockEditor from './use-navigation-block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

export default function NavigationEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const { post, isLoading } = useSelect( ( select ) => ( {
		post: select( 'core/edit-navigation' ).getNavigationPost( menuId ),
		isLoading: select( 'core/edit-navigation' ).isResolvingNavigationPost(
			menuId
		),
	} ) );
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ blocks, onInput, onChange ] = useNavigationBlockEditor( post );
	const { saveNavigationPost } = useDispatch( 'core/edit-navigation' );
	const save = () => saveNavigationPost( post );
	return (
		<div className="edit-navigation-menu-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<MenuEditorShortcuts.Register />

			{ isLoading ? (
				<Spinner />
			) : (
				<BlockEditorProvider
					value={ blocks }
					onInput={ onInput }
					onChange={ onChange }
					settings={ {
						...blockEditorSettings,
						templateLock: 'all',
						hasFixedToolbar: true,
					} }
				>
					<BlockEditorKeyboardShortcuts />
					<MenuEditorShortcuts saveBlocks={ save } />
					<NavigationStructureArea
						blocks={ blocks }
						initialOpen={ isLargeViewport }
					/>
					<BlockEditorArea
						saveBlocks={ save }
						menuId={ post.menuId }
						onDeleteMenu={ onDeleteMenu }
					/>
				</BlockEditorProvider>
			) }
		</div>
	);
}
