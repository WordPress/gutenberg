/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Overlay, { SLOT_NAME } from './overlay';
import withContext from '../higher-order/with-context';

class OverlayPortal extends Component {
	render() {
		const { fills } = this.props;

		if ( ! fills.length ) {
			return null;
		}

		return <Overlay.Slot />;
	}
}

export default compose( [
	withContext( 'getFills' )( getFills => {
		return {
			fills: getFills( SLOT_NAME ),
		};
	} ),
] )( OverlayPortal );
