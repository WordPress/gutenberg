/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function InserterTabs( { children } ) {
	return (
		<TabPanel
			className="block-editor-inserter__tabs"
			tabs={ [
				{
					name: 'blocks',
					/* translators: Blocks tab title in the block inserter. */
					title: __( 'Blocks' ),
				},
				{
					name: 'patterns',
					/* translators: Patterns tab title in the block inserter. */
					title: __( 'Patterns' ),
				},
			] }
		>
			{ children }
		</TabPanel>
	);
}

export default InserterTabs;
