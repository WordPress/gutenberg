/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import withFocusReturn from '../higher-order/with-focus-return';
import withFocusContain from '../higher-order/with-focus-contain';

class Overlay extends Component {
	render() {
		return (
			<div role="dialog" aria-modal="true">
				<button>First</button>
				<button>Second</button>
				<button>Third</button>
			</div>
		);
	}
}

export default compose( [
	withFocusReturn,
	withFocusContain,
] )( Overlay );
