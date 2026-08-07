import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useBlocksFocusControl from '../focus-control/use-blocks-focus-control';
import { unlock } from '../../lock-unlock';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorPrivateApis );

// Rendered inside the provider because the focus control looks up block
// elements through the block refs context.
function BlocksFocusControl( { blocks } ) {
	useBlocksFocusControl( blocks );
	return null;
}

export default function SidebarEditorProvider( {
	sidebar,
	settings,
	children,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );

	return (
		<ExperimentalBlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
			useSubRegistry={ false }
		>
			<BlocksFocusControl blocks={ blocks } />
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}
