/**
 * External dependencies
 */
import { set } from 'lodash';
/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import './store';
import fetchLinkSuggestions from './utils/fetch-link-suggestions';

function disableInsertingNonNavigationBlocks( settings, name ) {
	if ( ! [ 'core/navigation', 'core/navigation-link' ].includes( name ) ) {
		set( settings, [ 'supports', 'inserter' ], false );
	}
	return settings;
}

function removeNavigationBlockSettingsUnsupportedFeatures( settings, name ) {
	if ( name !== 'core/navigation' ) {
		return settings;
	}

	return {
		...settings,
		supports: {
			customClassName: false,
			html: false,
			inserter: true,
		},
		// Remove any block variations.
		variations: undefined,
	};
}

const removeNavigationBlockEditUnsupportedFeatures = createHigherOrderComponent(
	( BlockEdit ) => ( props ) => {
		if ( props.name !== 'core/navigation' ) {
			return <BlockEdit { ...props } />;
		}

		return (
			<BlockEdit
				{ ...props }
				hasSubmenuIndicatorSetting={ false }
				hasItemJustificationControls={ false }
				hasListViewModal={ false }
			/>
		);
	},
	'removeNavigationBlockEditUnsupportedFeatures'
);

export function initialize( id, settings ) {
	if ( ! settings.blockNavMenus ) {
		addFilter(
			'blocks.registerBlockType',
			'core/edit-navigation/disable-inserting-non-navigation-blocks',
			disableInsertingNonNavigationBlocks
		);
	}

	addFilter(
		'blocks.registerBlockType',
		'core/edit-navigation/remove-navigation-block-settings-unsupported-features',
		removeNavigationBlockSettingsUnsupportedFeatures
	);

	addFilter(
		'editor.BlockEdit',
		'core/edit-navigation/remove-navigation-block-edit-unsupported-features',
		removeNavigationBlockEditUnsupportedFeatures
	);

	registerCoreBlocks();

	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks();
	}

	settings.__experimentalFetchLinkSuggestions = () =>
		fetchLinkSuggestions( settings );

	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
