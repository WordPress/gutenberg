/**
 * WordPress dependencies
 */
import { BlockEditorProvider } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';

/**
 * Internal dependencies
 */
import useSidebarBlockEditor from './use-sidebar-block-editor';
import useBlocksFocusControl from '../focus-control/use-blocks-focus-control';

export default function SidebarEditorProvider( {
	sidebar,
	settings,
	children,
	blockAppenderRef,
} ) {
	const [ blocks, onInput, onChange ] = useSidebarBlockEditor( sidebar );
	const isEmpty = blocks.length === 0;

	useBlocksFocusControl( blocks );

	// Move the focus to the block appender to prevent focus from
	// being lost when emptying the widget area.
	useEffect( () => {
		if ( isEmpty ) {
			blockAppenderRef.current?.focus();
		}
	}, [ isEmpty, blockAppenderRef ] );

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
