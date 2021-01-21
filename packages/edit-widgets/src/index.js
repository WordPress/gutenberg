/**
 * WordPress dependencies
 */
import {
	registerBlockType,
	unstable__bootstrapServerSideBlockDefinitions, // eslint-disable-line camelcase
} from '@wordpress/blocks';
import { render } from '@wordpress/element';
import {
	registerCoreBlocks,
	__experimentalGetCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import './store';
import './hooks';
import { create as createLegacyWidget } from './blocks/legacy-widget';
import * as widgetArea from './blocks/widget-area';
import Layout from './components/layout';

function __experimentalAddWidgetIdAttribute( settings ) {
	return {
		...settings,
		attributes: {
			...( settings.attributes || {} ),
			__internal_widget_id: {
				type: 'string',
			},
		},
	};
}

/**
 * Initializes the block editor in the widgets screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Block editor settings.
 */
export function initialize( id, settings ) {
	addFilter(
		'blocks.registerBlockType',
		'gutenberg/edit-widgets/add-widget-id',
		__experimentalAddWidgetIdAttribute
	);

	const coreBlocks = __experimentalGetCoreBlocks().filter(
		( block ) => ! [ 'core/more' ].includes( block.name )
	);
	registerCoreBlocks( coreBlocks );

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}
	registerBlock( createLegacyWidget( settings ) );
	registerBlock( widgetArea );
	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}

/**
 * Function to register an individual block.
 *
 * @param {Object} block The block to be registered.
 *
 */
const registerBlock = ( block ) => {
	if ( ! block ) {
		return;
	}
	const { metadata, settings, name } = block;
	if ( metadata ) {
		unstable__bootstrapServerSideBlockDefinitions( { [ name ]: metadata } );
	}
	registerBlockType( name, settings );
};
