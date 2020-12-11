/**
 * WordPress dependencies
 */
import {
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
	registerCoreBlocks,
} from '@wordpress/block-library';
import { registerBlockType } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SidebarBlockEditorControl from './sidebar-block-editor-control';

const { wp } = window;

function registerBlocks() {
	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( block ) => ! [ 'core/more' ].includes( block.name )
	);
	registerCoreBlocks( coreBlocks );

	// TODO: Gotta move the legacy widget block out of edit-widgets.
	registerBlockType( 'core/legacy-widget', {
		title: 'Legacy Widget',
		attributes: {
			widgetClass: {
				type: 'string',
			},
			referenceWidgetName: {
				type: 'string',
			},
			name: {
				type: 'string',
			},
			idBase: {
				type: 'string',
			},
			number: {
				type: 'number',
			},
			instance: {
				type: 'object',
			},
		},
		edit( { attributes } ) {
			return <div>{ JSON.stringify( attributes ) }</div>;
		},
	} );

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}

	// TODO: Register Legacy Widget block.
}

// TODO: Maybe this should be called by an inline script? Not sure.
registerBlocks();

wp.customize.controlConstructor.sidebar_block_editor = SidebarBlockEditorControl;
export { SidebarBlockEditorControl };
