/**
 * External dependencies
 */
import { Button, Modal, SafeAreaView } from 'react-native';
import WebView from 'react-native-webview';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { parse } from '@wordpress/blocks';
import { withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import injectedJS from './injected-script.js';

export class UnsupportedBlockEditor extends Component {
	render() {
		const { blockHTML } = this.props;

		// Escape new-lines
		const escapedBlockHTML = blockHTML.replace( /\n/g, '\\n' );
		const scriptToInject = `
			window.insertedBlockHTML = '${ escapedBlockHTML }';
			${ injectedJS }
		`;

		return (
			<Modal
				animationType="slide"
				presentationStyle="fullScreen"
				visible={ true }
				onRequestClose={ () => this.props.closeModal() }
			>
				<SafeAreaView style={ { flex: 1, backgroundColor: 'black' } }>
					<Button
						onPress={ () =>
							this.setState( { isModalVisible: false } )
						}
						title="Close"
						color="grey"
					/>
					<Button
						onPress={ () =>
							this.webref.injectJavaScript( 'window.onSave()' )
						}
						title="Save"
						color="grey"
					/>
					<WebView
						ref={ ( r ) => ( this.webref = r ) }
						source={ {
							uri:
								'https://cruisinglamb.wordpress.com/wp-admin/post-new.php',
						} }
						injectedJavaScript={ scriptToInject }
						onMessage={ ( event ) => {
							const html = event.nativeEvent.data;
							this.props.replaceBlockWithHTML( parse( html ) );
							this.props.closeModal();
						} }
					/>
				</SafeAreaView>
			</Modal>
		);
	}
}

export default compose( [
	withDispatch( ( dispatch, { clientId } ) => {
		return {
			replaceBlockWithHTML( html ) {
				dispatch( 'core/block-editor' ).replaceBlock( clientId, html );
			},
		};
	} ),
] )( UnsupportedBlockEditor );
