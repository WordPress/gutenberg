/**
 * External dependencies
 */
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { select } from '@wordpress/data';
import { logException } from '@wordpress/react-native-bridge';
import {
	usePreferredColorSchemeStyle,
	withPreferredColorScheme,
} from '@wordpress/compose';
import { cautionFilled } from '@wordpress/icons';
import { Icon } from '@wordpress/components';

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

function CopyButton( {
	text,
	label,
	accessibilityLabel,
	accessibilityHint,
	secondary = false,
} ) {
	const containerStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__container' ],
		styles[ 'copy-button__container--dark' ]
	);

	const containerSecondaryStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__container--secondary' ],
		styles[ 'copy-button__container--secondary-dark' ]
	);

	const textStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__text' ],
		styles[ 'copy-button__text--dark' ]
	);

	const textSecondaryStyle = usePreferredColorSchemeStyle(
		styles[ 'copy-button__text--secondary' ],
		styles[ 'copy-button__text--secondary-dark' ]
	);

	return (
		<TouchableOpacity
			activeOpacity={ 0.5 }
			accessibilityLabel={ accessibilityLabel }
			style={ [ containerStyle, secondary && containerSecondaryStyle ] }
			accessibilityRole="button"
			accessibilityHint={ accessibilityHint }
			onPress={ () => {
				Clipboard.setString(
					typeof text === 'function' ? text() : text || ''
				);
			} }
		>
			<Text style={ [ textStyle, secondary && textSecondaryStyle ] }>
				{ label }
			</Text>
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

		const { getStylesFromColorScheme } = this.props;

		const iconContainerStyle = getStylesFromColorScheme(
			styles[ 'error-boundary__icon-container' ],
			styles[ 'error-boundary__icon-container--dark' ]
		);

		const titleStyle = getStylesFromColorScheme(
			styles[ 'error-boundary__title' ],
			styles[ 'error-boundary__title--dark' ]
		);

		const messageStyle = getStylesFromColorScheme(
			styles[ 'error-boundary__message' ],
			styles[ 'error-boundary__message--dark' ]
		);

		return (
			<SafeAreaView>
				<ScrollView
					style={ styles[ 'error-boundary__scroll' ] }
					contentContainerStyle={
						styles[ 'error-boundary__scroll-container' ]
					}
				>
					<View style={ styles[ 'error-boundary__container' ] }>
						<View style={ iconContainerStyle }>
							<Icon
								icon={ cautionFilled }
								{ ...styles[ 'error-boundary__icon' ] }
							/>
						</View>
						<Text style={ titleStyle }>
							{ __(
								'The editor has encountered an unexpected error'
							) }
						</Text>
						<Text style={ messageStyle }>
							{ __(
								'You can copy your post text in case your content is impacted. Copy error details to debug and share with support.'
							) }
						</Text>
						<View
							style={
								styles[ 'error-boundary__actions-container' ]
							}
						>
							<CopyButton
								label={ __( 'Copy post text' ) }
								accessibilityLabel={ __(
									'Button to copy post text'
								) }
								accessibilityHint={ __(
									'Tap here to copy post text'
								) }
								text={ getContent }
							/>
							<CopyButton
								label={ __( 'Copy error details' ) }
								accessibilityLabel={ __(
									'Button to copy error details'
								) }
								accessibilityHint={ __(
									'Tap here to copy error details'
								) }
								text={ error.stack }
								secondary
							/>
						</View>
					</View>
				</ScrollView>
			</SafeAreaView>
		);
	}
}

export default withPreferredColorScheme( ErrorBoundary );
