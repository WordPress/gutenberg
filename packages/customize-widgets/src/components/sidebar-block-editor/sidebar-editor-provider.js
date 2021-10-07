/**
 * WordPress dependencies
 */
import { BlockEditorProvider } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useBlocksFocusControl from '../focus-control/use-blocks-focus-control';

export default function SidebarEditorProvider( {
	sidebar,
	settings,
	children,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );

	useBlocksFocusControl( blocks );

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
