/**
 * WordPress dependencies
 */
import { experiments as blockEditorExperiments } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useBlocksFocusControl from '../focus-control/use-blocks-focus-control';

import { unlock } from '../../experiments';

const { ExperimentalBlockEditorProvider } = unlock( blockEditorExperiments );

export default function SidebarEditorProvider( {
	sidebar,
	settings,
	children,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );

	useBlocksFocusControl( blocks );

	return (
		<ExperimentalBlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
			useSubRegistry={ false }
		>
			{ children }
		</ExperimentalBlockEditorProvider>
	);
}
