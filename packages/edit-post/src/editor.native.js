/**
 * External dependencies
 */
import memize from 'memize';
import { I18nManager } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import {
	EditorProvider,
	ErrorBoundary,
	store as editorStore,
} from '@wordpress/editor';
import { parse, serialize } from '@wordpress/blocks';
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

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

		if ( props.initialHtmlModeEnabled && props.mode === 'visual' ) {
			// Enable html mode if the initial mode the parent wants it but we're not already in it.
			this.props.switchEditorMode( 'text' );
		}

		this.getEditorSettings = memize( this.getEditorSettings, {
			maxSize: 1,
		} );

		this.setTitleRef = this.setTitleRef.bind( this );
	}

	getEditorSettings( settings ) {
		settings = {
			...settings,
			isRTL: I18nManager.isRTL,
		};

		return settings;
	}

	componentDidMount() {
		const { editEntityRecord, postType, postId } = this.props;

		this.subscriptionParentSetFocusOnTitle = subscribeSetFocusOnTitle(
			() => {
				if ( this.postTitleRef ) {
					this.postTitleRef.focus();
				} else {
					// If the post title ref is not available, we postpone setting focus to when it's available.
					this.focusTitleWhenAvailable = true;
				}
			}
		);

		this.subscriptionParentFeaturedImageIdNativeUpdated =
			subscribeFeaturedImageIdNativeUpdated( ( payload ) => {
				editEntityRecord(
					'postType',
					postType,
					postId,
					{ featured_media: payload.featuredImageId },
					{
						undoIgnore: true,
					}
				);
			} );
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
		if ( this.focusTitleWhenAvailable && ! this.postTitleRef ) {
			this.focusTitleWhenAvailable = false;
			titleRef.focus();
		}

		this.postTitleRef = titleRef;
	}

	render() {
		const {
			settings,
			initialEdits,
			post,
			postId,
			postType,
			featuredImageId,
			initialHtml,
			...props
		} = this.props;

		const editorSettings = this.getEditorSettings( settings );

		const normalizedPost = post || {
			id: postId,
			title: {
				raw: props.initialTitle || '',
			},
			featured_media: featuredImageId,
			content: {
				// Make sure the post content is in sync with gutenberg store
				// to avoid marking the post as modified when simply loaded
				// For now, let's assume: serialize( parse( html ) ) !== html.
				raw: serialize( parse( initialHtml || '' ) ),
			},
			type: postType,
			status: 'draft',
			meta: [],
		};

		return (
			<GestureHandlerRootView style={ { flex: 1 } }>
				<SlotFillProvider>
					<EditorProvider
						settings={ editorSettings }
						post={ normalizedPost }
						initialEdits={ initialEdits }
						useSubRegistry={ false }
						{ ...props }
					>
						<ErrorBoundary>
							<Layout setTitleRef={ this.setTitleRef } />
						</ErrorBoundary>
					</EditorProvider>
				</SlotFillProvider>
			</GestureHandlerRootView>
		);
	}
}

export default compose( [
	withSelect( ( select ) => {
		const { getEditorMode } = select( editorStore );

		return {
			mode: getEditorMode(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { switchEditorMode } = dispatch( editorStore );
		const { editEntityRecord } = dispatch( coreStore );
		return {
			switchEditorMode,
			editEntityRecord,
		};
	} ),
] )( Editor );
