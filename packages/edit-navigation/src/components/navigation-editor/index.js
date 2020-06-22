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
import NavigationEditorShortcuts from './shortcuts';
import BlockEditorArea from './block-editor-area';
import NavigationStructureArea from './navigation-structure-area';
import useNavigationBlockEditor from './use-navigation-block-editor';
import { useDispatch, useSelect } from '@wordpress/data';

export default function NavigationEditor( {
	menuId,
	blockEditorSettings,
	onDeleteMenu,
} ) {
	const { post, hasResolved } = useSelect( ( select ) => ( {
		post: select( 'core/edit-navigation' ).getNavigationPostForMenu(
			menuId
		),
		hasResolved: select( 'core/edit-navigation' ).hasResolvedNavigationPost(
			menuId
		),
	} ) );
	return (
		<div className="edit-navigation-editor">
			<BlockEditorKeyboardShortcuts.Register />
			<NavigationEditorShortcuts.Register />

			{ ! hasResolved ? (
				<Spinner />
			) : (
				<NavigationPostEditor
					post={ post }
					blockEditorSettings={ blockEditorSettings }
					onDeleteMenu={ onDeleteMenu }
				/>
			) }
		</div>
	);
}

function NavigationPostEditor( { post, blockEditorSettings, onDeleteMenu } ) {
	const isLargeViewport = useViewportMatch( 'medium' );
	const [ blocks, onInput, onChange ] = useNavigationBlockEditor( post );
	const { saveNavigationPost } = useDispatch( 'core/edit-navigation' );
	const save = () => saveNavigationPost( post );
	return (
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
			<NavigationEditorShortcuts saveBlocks={ save } />
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
	);
}
