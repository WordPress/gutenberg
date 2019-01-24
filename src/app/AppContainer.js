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
	initialHtml: string,
	resetBlocks: Array<BlockType> => mixed,
	setupEditor: ( mixed, ?mixed ) => mixed,
	toggleBlockMode: ?string => mixed,
	getBlocks: () => Array<BlockType>,
	post: ?mixed,
};

type StateType = {
	title: string,
};

class AppContainer extends React.Component<PropsType, StateType> {
	lastHtml: ?string;
	lastTitle: ?string;

	constructor( props: PropsType ) {
		super( props );

		const post = props.post || {
			id: 1,
			content: {
				raw: props.initialHtml,
			},
			type: 'draft',
		};

		this.state = {
			title: props.title,
		};

		props.setupEditor( post );
		this.lastHtml = serialize( parse( props.initialHtml ) );
		this.lastTitle = props.title;

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
		const hasChanges = this.state.title !== this.lastTitle || this.lastHtml !== html;

		RNReactNativeGutenbergBridge.provideToNative_Html( html, this.state.title, hasChanges );

		this.lastTitle = this.state.title;
		this.lastHtml = html;
	};

	toggleHtmlModeAction = () => {
		this.props.toggleBlockMode( this.props.rootClientId );
	};

	setTitleAction = ( title: string ) => {
		this.setState( { title: title } );
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
				title={ this.state.title }
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
		} = select( 'core/editor' );

		return {
			getBlocks,
			showHtml: getBlockMode( rootClientId ) === 'html',
			editedPostContent: getEditedPostContent(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const {
			resetBlocks,
			setupEditor,
			toggleBlockMode,
		} = dispatch( 'core/editor' );

		return {
			resetBlocks,
			setupEditor,
			toggleBlockMode,
		};
	} ),
] )( AppContainer );
