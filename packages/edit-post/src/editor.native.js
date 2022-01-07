/**
 * External dependencies
 */
import memize from 'memize';
import { size, map, without } from 'lodash';
import { I18nManager } from 'react-native';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { EditorProvider } from '@wordpress/editor';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	subscribeSetFocusOnTitle,
	subscribeFeaturedImageIdNativeUpdated,
} from '@wordpress/react-native-bridge';
import { SlotFillProvider } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import Layout from './components/layout';
import { store as editPostStore } from './store';

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

		// need to set this globally to avoid race with deprecations
		// defaulting to true to avoid issues with a not-yet-cached value
		const { galleryWithImageBlocks = true } = props;
		window.wp.galleryBlockV2Enabled = galleryWithImageBlocks;

		if ( props.initialHtmlModeEnabled && props.mode === 'visual' ) {
			// enable html mode if the initial mode the parent wants it but we're not already in it
			this.props.switchEditorMode( 'text' );
		}

		this.getEditorSettings = memize( this.getEditorSettings, {
			maxSize: 1,
		} );

		this.setTitleRef = this.setTitleRef.bind( this );
	}

	getEditorSettings(
		settings,
		hasFixedToolbar,
		focusMode,
		hiddenBlockTypes,
		blockTypes
	) {
		settings = {
			...settings,
			isRTL: I18nManager.isRTL,
			hasFixedToolbar,
			focusMode,
		};

		// Omit hidden block types if exists and non-empty.
		if ( size( hiddenBlockTypes ) > 0 ) {
			if ( settings.allowedBlockTypes === undefined ) {
				// if no specific flags for allowedBlockTypes are set, assume `true`
				// meaning allow all block types
				settings.allowedBlockTypes = true;
			}
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes =
				true === settings.allowedBlockTypes
					? map( blockTypes, 'name' )
					: settings.allowedBlockTypes || [];

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes
			);
		}

		return settings;
	}

	componentDidMount() {
		const { editEntityRecord, postType, postId } = this.props;

		this.subscriptionParentSetFocusOnTitle = subscribeSetFocusOnTitle(
			() => {
				if ( this.postTitleRef ) {
					this.postTitleRef.focus();
				}
			}
		);

		this.subscriptionParentFeaturedImageIdNativeUpdated = subscribeFeaturedImageIdNativeUpdated(
			( payload ) => {
				editEntityRecord(
					'postType',
					postType,
					postId,
					{ featured_media: payload.featuredImageId },
					{
						undoIgnore: true,
					}
				);
			}
		);
	}

	componentWillUnmount() {
		if ( this.subscriptionParentSetFocusOnTitle ) {
			this.subscriptionParentSetFocusOnTitle.remove();
		}

		if ( this.subscribeFeaturedImageIdNativeUpdated ) {
			this.subscribeFeaturedImageIdNativeUpdated.remove();
		}
	}

	setTitleRef( titleRef ) {
		this.postTitleRef = titleRef;
	}

	render() {
		const {
			settings,
			hasFixedToolbar,
			focusMode,
			initialEdits,
			hiddenBlockTypes,
			blockTypes,
			post,
			postId,
			postType,
			featuredImageId,
			initialHtml,
			...props
		} = this.props;

		const editorSettings = this.getEditorSettings(
			settings,
			hasFixedToolbar,
			focusMode,
			hiddenBlockTypes,
			blockTypes
		);

		const normalizedPost = post || {
			id: postId,
			title: {
				raw: props.initialTitle || '',
			},
			featured_media: featuredImageId,
			content: {
				// make sure the post content is in sync with gutenberg store
				// to avoid marking the post as modified when simply loaded
				// For now, let's assume: serialize( parse( html ) ) !== html
				raw: serialize( parse( initialHtml || '' ) ),
			},
			type: postType,
			status: 'draft',
			meta: [],
		};

		return (
			<SlotFillProvider>
				<EditorProvider
					settings={ editorSettings }
					post={ normalizedPost }
					initialEdits={ initialEdits }
					useSubRegistry={ false }
					{ ...props }
				>
					<Layout setTitleRef={ this.setTitleRef } />
				</EditorProvider>
			</SlotFillProvider>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isFeatureActive,
			getEditorMode,
			getPreference,
			__experimentalGetPreviewDeviceType,
		} = select( editPostStore );
		const { getBlockTypes } = select( blocksStore );

		return {
			hasFixedToolbar:
				isFeatureActive( 'fixedToolbar' ) ||
				__experimentalGetPreviewDeviceType() !== 'Desktop',
			focusMode: isFeatureActive( 'focusMode' ),
			mode: getEditorMode(),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			blockTypes: getBlockTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { switchEditorMode } = dispatch( editPostStore );
		const { editEntityRecord } = dispatch( coreStore );
		return {
			switchEditorMode,
			editEntityRecord,
		};
	} ),
] )( Editor );
