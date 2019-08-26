/**
 * External dependencies
 */
import { eventEmitter, initialMode } from 'react-native-dark-mode';
import React from 'react';

// This was failing on CI
if ( eventEmitter.setMaxListeners ) {
	eventEmitter.setMaxListeners( 150 );
}

export function useStyle( light, dark, theme ) {
	const finalDark = {
		...light,
		...dark,
	};

	return theme === 'dark' ? finalDark : light;
}

// This function takes a component...
export function withTheme( WrappedComponent ) {
	return class extends React.Component {
		constructor( props ) {
			super( props );

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
			eventEmitter.removeListener( 'currentModeChanged', this.onModeChanged );
		}

		render() {
			return <WrappedComponent theme={ this.state.mode } { ...this.props } />;
		}
	};
}
