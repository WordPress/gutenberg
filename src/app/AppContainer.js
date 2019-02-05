/** @flow
 * @format */

import React from 'react';
import { parse, serialize } from '@wordpress/blocks';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import RNReactNativeGutenbergBridge from 'react-native-gutenberg-bridge';

import MainApp from './MainApp';
import type { BlockType } from '../store/types';

type PropsType = {
	rootClientId: ?string,
	initialHtmlModeEnabled: boolean,
	showHtml: boolean,
	editedPostContent: string,
	title: string,
	initialTitle: string,
	initialHtml: string,
	editTitle: string => mixed,
	resetBlocks: Array<BlockType> => mixed,
	setupEditor: ( mixed, ?mixed ) => mixed,
	toggleBlockMode: ?string => mixed,
	getBlocks: () => Array<BlockType>,
	post: ?mixed,
};

class AppContainer extends React.Component<PropsType> {
	lastHtml: ?string;
	lastTitle: ?string;

	constructor( props: PropsType ) {
		super( props );

		const post = props.post || {
			id: 1,
			title: {
				raw: props.initialTitle,
			},
			content: {
				raw: props.initialHtml,
			},
			type: 'draft',
		};

		props.setupEditor( post );
		this.lastHtml = serialize( parse( props.initialHtml ) );
		this.lastTitle = props.initialTitle;

		if ( props.initialHtmlModeEnabled && ! props.showHtml ) {
			// enable html mode if the initial mode the parent wants it but we're not already in it
			this.toggleHtmlModeAction();
		}
	}

	serializeToNativeAction = () => {
		if ( this.props.showHtml ) {
			this.updateHtmlAction( this.props.editedPostContent );
		}

		const html = serialize( this.props.getBlocks() );
		const title = this.props.title;

		const hasChanges = title !== this.lastTitle || html !== this.lastHtml;

		RNReactNativeGutenbergBridge.provideToNative_Html( html, title, hasChanges );

		this.lastTitle = title;
		this.lastHtml = html;
	};

	toggleHtmlModeAction = () => {
		this.props.toggleBlockMode( this.props.rootClientId );
	};

	setTitleAction = ( title: string ) => {
		this.props.editTitle( title );
	};

	updateHtmlAction = ( html: string = '' ) => {
		const parsed = parse( html );
		this.props.resetBlocks( parsed );
	};

	render() {
		return (
			<MainApp
				rootClientId={ this.props.rootClientId }
				serializeToNativeAction={ this.serializeToNativeAction }
				toggleHtmlModeAction={ this.toggleHtmlModeAction }
				setTitleAction={ this.setTitleAction }
				updateHtmlAction={ this.updateHtmlAction }
				title={ this.props.title }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const {
			getBlocks,
			getBlockMode,
			getEditedPostContent,
			getEditedPostAttribute,
		} = select( 'core/editor' );

		return {
			getBlocks,
			showHtml: getBlockMode( rootClientId ) === 'html',
			editedPostContent: getEditedPostContent(),
			title: getEditedPostAttribute( 'title' ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			editPost,
			resetBlocks,
			setupEditor,
			toggleBlockMode,
		} = dispatch( 'core/editor' );

		return {
			editTitle( title ) {
				editPost( { title: title } );
			},
			resetBlocks,
			setupEditor,
			toggleBlockMode,
		};
	} ),
] )( AppContainer );
