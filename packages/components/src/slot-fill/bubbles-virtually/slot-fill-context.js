// @ts-nocheck
/**
 * External dependencies
 */
import { proxyMap } from 'valtio/utils';
/**
 * WordPress dependencies
 */
import { createContext } from '@wordpress/element';
import warning from '@wordpress/warning';

const SlotFillContext = createContext( {
	slots: proxyMap(),
	fills: proxyMap(),
	registerSlot: () => {
		warning(
			'Components must be wrapped within `SlotFillProvider`. ' +
				'See https://developer.wordpress.org/block-editor/components/slot-fill/'
		);
	},
	updateSlot: () => {},
	unregisterSlot: () => {},
	registerFill: () => {},
	unregisterFill: () => {},
} );

export default SlotFillContext;
