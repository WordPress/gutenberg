/**
 * External dependencies
 */
import { map, set, flatten, partialRight } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { render } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';
import { decodeEntities } from '@wordpress/html-entities';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import './store';

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

/**
 * Fetches link suggestions from the API. This function is an exact copy of a function found at:
 *
 * packages/editor/src/components/provider/index.js
 *
 * It seems like there is no suitable package to import this from. Ideally it would be either part of core-data.
 * Until we refactor it, just copying the code is the simplest solution.
 *
 * @param {string} search
 * @param {Object} [searchArguments]
 * @param {number} [searchArguments.isInitialSuggestions]
 * @param {number} [searchArguments.type]
 * @param {number} [searchArguments.subtype]
 * @param {Object} [editorSettings]
 * @param {boolean} [editorSettings.disablePostFormats=false]
 * @return {Promise<Object[]>} List of suggestions
 */
const fetchLinkSuggestions = (
	search,
	{ isInitialSuggestions, type, subtype } = {},
	{ disablePostFormats = false } = {}
) => {
	const perPage = isInitialSuggestions ? 3 : 20;

	const queries = [];

	if ( ! type || type === 'post' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					per_page: perPage,
					type: 'post',
					subtype,
				} ),
			} ).catch( () => [] ) // fail by returning no results
		);
	}

	if ( ! type || type === 'term' ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					per_page: perPage,
					type: 'term',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	if ( ! disablePostFormats && ( ! type || type === 'post-format' ) ) {
		queries.push(
			apiFetch( {
				path: addQueryArgs( '/wp/v2/search', {
					search,
					per_page: perPage,
					type: 'post-format',
					subtype,
				} ),
			} ).catch( () => [] )
		);
	}

	return Promise.all( queries ).then( ( results ) => {
		return map( flatten( results ).slice( 0, perPage ), ( result ) => ( {
			id: result.id,
			url: result.url,
			title: decodeEntities( result.title ) || __( '(no title)' ),
			type: result.subtype || result.type,
		} ) );
	} );
};

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

	settings.__experimentalFetchLinkSuggestions = partialRight(
		fetchLinkSuggestions,
		settings
	);

	render(
		<Layout blockEditorSettings={ settings } />,
		document.getElementById( id )
	);
}
