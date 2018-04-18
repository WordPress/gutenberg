/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { focus } from '@wordpress/utils';

const withFocusContain = ( WrappedComponent ) => {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.focusContainRef = createRef();
			this.handleTabBehaviour = this.handleTabBehaviour.bind( this );
		}

		handleTabBehaviour( event ) {
			if ( event.keyCode === 9 ) {
				const tabbables = focus.tabbable.find( this.focusContainRef.current );
				if ( ! tabbables.length ) {
					return;
				}
				const firstTabbable = tabbables[ 0 ];
				const lastTabbable = tabbables[ tabbables.length - 1 ];

				if ( event.shiftKey && event.target === firstTabbable ) {
					event.preventDefault();
					return lastTabbable.focus();
				} else if ( ! event.shiftKey && event.target === lastTabbable ) {
					event.preventDefault();
					return firstTabbable.focus();
				}
			}
		}

		componentDidMount() {
			this.focusContainRef.current.addEventListener( 'keydown', this.handleTabBehaviour );
		}

		componentWillUnmount() {
			this.focusContainRef.current.addEventListener( 'keydown', this.handleTabBehaviour );
		}

		render() {
			return (
				<div ref={ this.focusContainRef }>
					<WrappedComponent { ...this.props } />
				</div>
			);
		}
	};
};

export default withFocusContain;
