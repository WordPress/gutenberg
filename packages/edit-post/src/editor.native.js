/**
 * External dependencies
 */
import memize from 'memize';
import { size, map, without } from 'lodash';
import { subscribeSetFocusOnTitle } from 'react-native-gutenberg-bridge';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { EditorProvider } from '@wordpress/editor';
import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { SlotFillProvider } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Layout from './components/layout';

class Editor extends Component {
	constructor( props ) {
		super( ...arguments );

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
		blockTypes,
	) {
		settings = {
			...settings,
			hasFixedToolbar,
			focusMode,
		};

		// Omit hidden block types if exists and non-empty.
		if ( size( hiddenBlockTypes ) > 0 ) {
			// Defer to passed setting for `allowedBlockTypes` if provided as
			// anything other than `true` (where `true` is equivalent to allow
			// all block types).
			const defaultAllowedBlockTypes = (
				true === settings.allowedBlockTypes ?
					map( blockTypes, 'name' ) :
					( settings.allowedBlockTypes || [] )
			);

			settings.allowedBlockTypes = without(
				defaultAllowedBlockTypes,
				...hiddenBlockTypes,
			);
		}

		return settings;
	}

	componentDidMount() {
		this.subscriptionParentSetFocusOnTitle = subscribeSetFocusOnTitle( () => {
			if ( this.postTitleRef ) {
				this.postTitleRef.focus();
			}
		} );
	}

	componentWillUnmount() {
		if ( this.subscriptionParentSetFocusOnTitle ) {
			this.subscriptionParentSetFocusOnTitle.remove();
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
			postType,
			...props
		} = this.props;

		const editorSettings = this.getEditorSettings(
			settings,
			hasFixedToolbar,
			focusMode,
			hiddenBlockTypes,
			blockTypes,
		);

		const normalizedPost = post || {
			id: 1,
			title: {
				raw: props.initialTitle,
			},
			content: {
				// make sure the post content is in sync with gutenberg store
				// to avoid marking the post as modified when simply loaded
				// For now, let's assume: serialize( parse( html ) ) !== html
				raw: serialize( parse( props.initialHtml || '' ) ),
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
		const { isFeatureActive, getEditorMode, getPreference } = select( 'core/edit-post' );
		const { getBlockTypes } = select( 'core/blocks' );

		return {
			hasFixedToolbar: isFeatureActive( 'fixedToolbar' ),
			focusMode: isFeatureActive( 'focusMode' ),
			mode: getEditorMode(),
			hiddenBlockTypes: getPreference( 'hiddenBlockTypes' ),
			blockTypes: getBlockTypes(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			switchEditorMode,
		} = dispatch( 'core/edit-post' );

		return {
			switchEditorMode,
		};
	} ),
] )( Editor );
