/**
 * External dependencies
 */
import { forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { getBlockMenuDefaultClassName, getBlockTypes } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { dispatch, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import DiscoverBlockListItem from '../discover-block-list-item';

/**
 * Dynamically loads script
 *
 * @param {Object} asset The asset object as described in block.json.
 * @param {Function} onLoad The callback function when script is loaded.
 * @param {Function} onError The callback function when script is error loading.
 */
const loadScipt = ( asset, onLoad, onError ) => {
	if ( ! asset ) {
		return;
	}
	const existing = document.querySelector( `script[src="${ asset.src }"]` );
	if ( existing ) {
		existing.parentNode.removeChild( existing );
	}
	const script = document.createElement( 'script' );
	script.src = typeof asset === 'string' ? asset : asset.src;
	script.onload = onLoad;
	script.onerror = onError;
	document.body.appendChild( script );
};

/**
 * Dynamically loads stylesheets
 *
 * @param {Object} asset The asset object as described in block.json.
 */
const loadStyle = ( asset ) => {
	if ( ! asset ) {
		return;
	}
	const link = document.createElement( 'link' );
	link.rel = 'stylesheet';
	link.href = typeof asset === 'string' ? asset : asset.src;
	document.body.appendChild( link );
};

/**
 * Loads block's assets
 *
 * @param {Object|Array} assets The asset object as described in block.json or array of URL of the
 * @param {Function} onLoad The callback function when script is loaded.
 * @param {Function} onError The callback function when script is error loading.
  *
 * @return {number} The number of scripts loaded.
 */
const loadAssets = ( assets, onLoad, onError ) => {
	let scriptsCount = 0;
	if ( typeof assets === 'object' && assets.constructor === Array ) {
		forEach( assets, ( asset ) => {
			if ( asset.match( /\.js$/ ) !== null ) {
				scriptsCount++;
				onLoad.bind( scriptsCount );
				loadScipt( asset, onLoad, onError, scriptsCount );
			} else {
				loadStyle( asset );
			}
		} );
	} else {
		scriptsCount++;
		loadScipt( assets.editor_script, onLoad, onError );
		loadStyle( assets.style );
	}
	return scriptsCount;
};

/**
 * Handle a downloadable block to load assets, notify and retry on errors.
 *
 * @param {Object} item The selected block item
 * @param {Function} onSelect The callback function when the assets are loaded.
 */
const handleDownloadableBlock = ( item, onSelect ) => {
	const {
		createErrorNotice,
		removeNotice,
	} = dispatch( 'core/notices' );

	let scriptsCount = 0;
	const onLoad = () => {
		scriptsCount--;
		if ( scriptsCount > 0 ) {
			return;
		}
		const registeredBlocks = getBlockTypes();
		if ( registeredBlocks.length ) {
			onSelect( item );
		}
	};
	const onError = () => {
		createErrorNotice( __( 'Block previews can\'t load.' ), {
			id: 'block-preview-error',
			actions: [
				{
					label: __( 'Retry' ),
					onClick: () => {
						removeNotice( 'block-preview-error' );
						scriptsCount = loadAssets( item.assets, onLoad, onError );
					},
				},
			],
		} );
	};
	scriptsCount = loadAssets( item.assets, onLoad, onError );
};

function DiscoverBlocksList( { items, onSelect, onHover = () => {}, children, installBlock } ) {
	return (
		/*
		 * Disable reason: The `list` ARIA role is redundant but
		 * Safari+VoiceOver won't announce the list otherwise.
		 */
		/* eslint-disable jsx-a11y/no-redundant-roles */
		<ul role="list" className="block-editor-discover-blocks-list">
			{ items && items.map( ( item ) =>
				<DiscoverBlockListItem
					key={ item.id }
					className={ getBlockMenuDefaultClassName( item.id ) }
					icons={ item.icons }
					onClick={ () => {
						handleDownloadableBlock( item, onSelect );
						installBlock( item.id );
						onHover( null );
					} }
					onFocus={ () => onHover( item ) }
					onMouseEnter={ () => onHover( item ) }
					onMouseLeave={ () => onHover( null ) }
					onBlur={ () => onHover( null ) }
					isDisabled={ item.isDisabled }
					item={ item }
				/>
			) }
			{ children }
		</ul>
		/* eslint-enable jsx-a11y/no-redundant-roles */
	);
}

export default compose(
	withDispatch( ( ownDispatch ) => {
		const { installBlock } = ownDispatch( 'core/download-blocks' );
		const { removeNotice } = ownDispatch( 'core/notices' );

		const retryIfFailed = ( slug ) => {
			removeNotice( 'block-install-error' );
			installBlock( slug, retryIfFailed, removeIfFailed );
		};

		const removeIfFailed = () => {
			removeNotice( 'block-install-error' );
			//TODO: remove block and unregister block type from editor;
		};

		return {
			installBlock: ( slug ) => {
				installBlock( slug, retryIfFailed, removeIfFailed );
			},
			removeNotice,
		};
	} ),
)( DiscoverBlocksList );
