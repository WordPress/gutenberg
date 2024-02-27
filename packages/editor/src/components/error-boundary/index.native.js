/**
 * External dependencies
 */
import { Text, TouchableOpacity, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import { Warning } from '@wordpress/block-editor';
import { logException } from '@wordpress/react-native-bridge';
import { usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import styles from './style.scss';

function getContent() {
	try {
		// While `select` in a component is generally discouraged, it is
		// used here because it (a) reduces the chance of data loss in the
		// case of additional errors by performing a direct retrieval and
		// (b) avoids the performance cost associated with unnecessary
		// content serialization throughout the lifetime of a non-erroring
		// application.
		return select( editorStore ).getEditedPostContent();
	} catch ( error ) {}
}

function CopyButton( { text, label, accessibilityLabel, accessibilityHint } ) {
	const containerStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__container' ],
		styles[ 'copy-button__container--dark' ]
	);
	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__text' ],
		styles[ 'copy-button__text--dark' ]
	);

	return (
		<TouchableOpacity
			activeOpacity={ 0.5 }
			accessibilityLabel={ accessibilityLabel }
			style={ containerStyle }
			accessibilityRole={ 'button' }
			accessibilityHint={ accessibilityHint }
			onPress={ () => {
				Clipboard.setString(
					typeof text === 'function' ? text() : text || ''
				);
			} }
		>
			<Text style={ textStyle }>{ label }</Text>
		</TouchableOpacity>
	);
}

class ErrorBoundary extends Component {
	constructor() {
		super( ...arguments );

		this.state = {
			error: null,
		};
	}

	componentDidCatch( error ) {
		logException( error, {
			context: {
				component_stack: error.componentStack,
			},
			isHandled: true,
			handledBy: 'Editor-level Error Boundary',
		} );
	}

	static getDerivedStateFromError( error ) {
		return { error };
	}

	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		const actions = (
			<View style={ styles[ 'error-boundary__actions-container' ] }>
				<CopyButton
					label={ __( 'Copy Post Text' ) }
					accessibilityLabel={ __( 'Button to copy post text' ) }
					accessibilityHint={ __( 'Tap here to copy post text' ) }
					text={ getContent }
				/>
				<CopyButton
					label={ __( 'Copy Error' ) }
					accessibilityLabel={ __( 'Button to copy error' ) }
					accessibilityHint={ __( 'Tap here to copy error' ) }
					text={ error.stack }
				/>
			</View>
		);

		return (
			<Warning
				actions={ actions }
				message={ __(
					'The editor has encountered an unexpected error.'
				) }
				containerStyle={ styles[ 'error-boundary__container' ] }
				messageStyle={ styles[ 'error-boundary__message' ] }
			/>
		);
	}
}

export default ErrorBoundary;
