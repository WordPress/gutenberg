/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';

/**
 * Internal dependencies
 */
import getSidebarSection from './controls/sidebar-section';
import getSidebarControl from './controls/sidebar-control';

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
		__experimentalRegisterExperimentalCoreBlocks( {
			enableLegacyWidgetBlock: true,
		} );
	}

	wp.customize.sectionConstructor.sidebar = getSidebarSection();
	wp.customize.controlConstructor.sidebar_block_editor = getSidebarControl();
}

wp.domReady( initialize );
