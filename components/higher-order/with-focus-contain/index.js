/* eslint-disable jsx-a11y/no-static-element-interactions */
/**
 * WordPress dependencies
 */
import { Component, createRef } from '@wordpress/element';
import { focus, keycodes } from '@wordpress/utils';

const {
	TAB,
} = keycodes;

const withFocusContain = ( WrappedComponent ) => {
	return class extends Component {
		constructor() {
			super( ...arguments );

			this.focusContainRef = createRef();
			this.handleTabBehaviour = this.handleTabBehaviour.bind( this );
		}

		handleTabBehaviour( event ) {
			if ( ! event.keyCode === TAB ) {
				return;
			}

			const tabbables = focus.tabbable.find( this.focusContainRef.current );
			if ( ! tabbables.length ) {
				return;
			}
			const firstTabbable = tabbables[ 0 ];
			const lastTabbable = tabbables[ tabbables.length - 1 ];

			if ( event.shiftKey && event.target === firstTabbable ) {
				event.preventDefault();
				lastTabbable.focus();
			} else if ( ! event.shiftKey && event.target === lastTabbable ) {
				event.preventDefault();
				firstTabbable.focus();
			}
		}

		render() {
			return (
				<div
					onKeyDown={ this.handleTabBehaviour }
					ref={ this.focusContainRef } >
					<WrappedComponent { ...this.props } />
				</div>
			);
		}
	};
};

export default withFocusContain;
