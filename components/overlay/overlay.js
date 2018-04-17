/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ManagedOverlay from './managed-overlay';
import './style.scss';
import { Slot, Fill } from '../slot-fill';

export const SLOT_NAME = 'Overlay';

class Overlay extends Component {
	render() {
		const {
			children,
			...otherProps
		} = this.props;
		return (
			<Fill name={ SLOT_NAME }>
				<ManagedOverlay { ...otherProps } >
					{ children }
				</ManagedOverlay>
			</Fill>
		);
	}
}

Overlay.Slot = () => <Slot name={ SLOT_NAME } />;

export default Overlay;
