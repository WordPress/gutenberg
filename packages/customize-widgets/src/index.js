/**
 * WordPress dependencies
 */
import { registerBlockType } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import SidebarSection from './controls/sidebar-section';
import SidebarControl from './controls/sidebar-control';

const { wp } = window;

/**
 * Initializes the widgets block editor in the customizer.
 */
export function initialize() {
	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( block ) => ! [ 'core/more' ].includes( block.name )
	);
	registerCoreBlocks( coreBlocks );

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}

	// TODO: Register legacy widgets block
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

	wp.customize.sectionConstructor.sidebar = SidebarSection;
	wp.customize.controlConstructor.sidebar_block_editor = SidebarControl;
}

wp.domReady( initialize );
