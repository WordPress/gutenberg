/**
 * WordPress dependencies
 */
import { SlotFillProvider, Popover } from '@wordpress/components';
// import { store as noticesStore } from '@wordpress/notices';
// import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Layout from '../layout';

export default function App() {
	return (
		<SlotFillProvider>
			<Popover.Slot />
			<Layout />
		</SlotFillProvider>
	);
}
