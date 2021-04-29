/**
 * WordPress dependencies
 */
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useFocusControl from '../focus-control/use-focus-control';

export default function SidebarEditorProvider( {
	sidebar,
	settings,
	children,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );

	useFocusControl( blocks );

	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
			useSubRegistry={ false }
		>
			{ children }
		</BlockEditorProvider>
	);
}
