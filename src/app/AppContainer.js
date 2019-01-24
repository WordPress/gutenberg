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
	initialHtml: string,
	resetBlocks: Array<BlockType> => mixed,
	setupEditor: ( mixed, ?mixed ) => mixed,
	toggleBlockMode: ?string => mixed,
	getBlocks: () => Array<BlockType>,
	post: ?mixed,
};

class AppContainer extends React.Component<PropsType> {
	lastHtml: ?string;

	constructor( props: PropsType ) {
		super( props );

		const post = props.post || {
			id: 1,
			content: {
				raw: props.initialHtml,
			},
			type: 'draft',
		};

		this.props.setupEditor( post );
		this.lastHtml = serialize( parse( props.initialHtml ) );

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
		RNReactNativeGutenbergBridge.provideToNative_Html( html, this.lastHtml !== html );
		this.lastHtml = html;
	};

	toggleHtmlModeAction = () => {
		this.props.toggleBlockMode( this.props.rootClientId );
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
				updateHtmlAction={ this.updateHtmlAction }
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
