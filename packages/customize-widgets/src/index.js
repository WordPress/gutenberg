/**
 * WordPress dependencies
 */
import { render, unmountComponentAtNode } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import {
	registerLegacyWidgetBlock,
	registerLegacyWidgetVariations,
} from '@wordpress/widgets';
import { setFreeformContentHandlerName } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import CustomizeWidgets from './components/customize-widgets';
import getSidebarSection from './controls/sidebar-section';
import getSidebarControl from './controls/sidebar-control';
import './filters';

const { wp } = window;

const DISABLED_BLOCKS = [ 'core/more', 'core/block', 'core/freeform' ];
const ENABLE_EXPERIMENTAL_FSE_BLOCKS = false;

export function reinitializeEditor( target, sidebarControls, settings ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind(
		null,
		target,
		sidebarControls,
		settings
	);
	render(
		<CustomizeWidgets
			api={ wp.customize }
			sidebarControls={ sidebarControls }
			blockEditorSettings={ settings }
			onError={ reboot }
		/>,
		target
	);
}

/**
 * Initializes the widgets block editor in the customizer.
 *
 * @param {string} editorName          The editor name.
 * @param {Object} blockEditorSettings Block editor settings.
 */
export function initialize( editorName, blockEditorSettings ) {
	const coreBlocks = __experimentalGetCoreBlocks().filter( ( block ) => {
		return ! (
			DISABLED_BLOCKS.includes( block.name ) ||
			block.name.startsWith( 'core/post' ) ||
			block.name.startsWith( 'core/query' ) ||
			block.name.startsWith( 'core/site' )
		);
	} );
	registerCoreBlocks( coreBlocks );
	registerLegacyWidgetBlock();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: ENABLE_EXPERIMENTAL_FSE_BLOCKS,
		} );
	}
	registerLegacyWidgetVariations( blockEditorSettings );

	// As we are unregistering `core/freeform` to avoid the Classic block, we must
	// replace it with something as the default freeform content handler. Failure to
	// do this will result in errors in the default block parser.
	// see: https://github.com/WordPress/gutenberg/issues/33097
	setFreeformContentHandlerName( 'core/html' );

	const SidebarControl = getSidebarControl( blockEditorSettings );

	wp.customize.sectionConstructor.sidebar = getSidebarSection();
	wp.customize.controlConstructor.sidebar_block_editor = SidebarControl;

	const container = document.createElement( 'div' );
	container.classList.add( 'test' );
	document.body.appendChild( container );

	wp.customize.bind( 'ready', () => {
		const sidebarControls = [];
		wp.customize.control.each( ( control ) => {
			if ( control instanceof SidebarControl ) {
				sidebarControls.push( control );
			}
		} );

		const reboot = reinitializeEditor.bind(
			null,
			container,
			sidebarControls,
			blockEditorSettings
		);

		render(
			<CustomizeWidgets
				api={ wp.customize }
				sidebarControls={ sidebarControls }
				blockEditorSettings={ blockEditorSettings }
				onError={ reboot }
			/>,
			container
		);
	} );
}
