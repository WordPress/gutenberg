/**
 * External dependencies
 */
import { eventEmitter, initialMode } from 'react-native-dark-mode';
import React from 'react';

// Conditional needed to pass UI Tests on CI
if ( eventEmitter.setMaxListeners ) {
	eventEmitter.setMaxListeners( 150 );
}

export function withTheme( WrappedComponent ) {
	return class extends React.Component {
		constructor( props ) {
			super( props );

			this.onModeChanged = this.onModeChanged.bind( this );
			this.useStyle = this.useStyle.bind( this );

			this.state = {
				mode: initialMode,
			};
		}

		onModeChanged( newMode ) {
			this.setState( { mode: newMode } );
		}

		componentDidMount() {
			this.subscription = eventEmitter.on( 'currentModeChanged', this.onModeChanged );
		}

		componentWillUnmount() {
			// Conditional needed to pass UI Tests on CI
			if ( eventEmitter.removeListener ) {
				eventEmitter.removeListener( 'currentModeChanged', this.onModeChanged );
			}
		}

		useStyle( light, dark ) {
			const isDarkMode = this.state.mode === 'dark';
			const finalDark = {
				...light,
				...dark,
			};

			return isDarkMode ? finalDark : light;
		}

		render() {
			return <WrappedComponent
				theme={ this.state.mode }
				useStyle={ this.useStyle }
				{ ...this.props }
			/>;
		}
	};
}
