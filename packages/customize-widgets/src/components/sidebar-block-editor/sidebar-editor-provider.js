/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import {
	BlockEditorProvider,
	BlockEditorKeyboardShortcuts,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';
import Header from '../header';
import useInserter from '../inserter/use-inserter';

export default function SidebarEditorProvider( {
	sidebar,
	inserter,
	children,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const [ isInserterOpened, setIsInserterOpened ] = useInserter( inserter );
	const settings = useMemo(
		() => ( {
			__experimentalSetIsInserterOpened: setIsInserterOpened,
		} ),
		[]
	);

	return (
		<BlockEditorProvider
			value={ blocks }
			onInput={ onInput }
			onChange={ onChange }
			settings={ settings }
			useSubRegistry={ false }
		>
			<BlockEditorKeyboardShortcuts />

			<Header
				inserter={ inserter }
				isInserterOpened={ isInserterOpened }
				setIsInserterOpened={ setIsInserterOpened }
			/>

			{ children }
		</BlockEditorProvider>
	);
}
