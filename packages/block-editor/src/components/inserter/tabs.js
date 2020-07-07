/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const blocksTab = {
	name: 'blocks',
	/* translators: Blocks tab title in the block inserter. */
	title: __( 'Blocks' ),
};
const patternsTab = {
	name: 'patterns',
	/* translators: Patterns tab title in the block inserter. */
	title: __( 'Patterns' ),
};
const reusableBlocksTab = {
	name: 'reusable',
	/* translators: Reusable blocks tab title in the block inserter. */
	title: __( 'Reusable' ),
};

function InserterTabs( {
	children,
	showPatterns = false,
	showReusableBlocks = false,
} ) {
	const tabs = [ blocksTab ];

	if ( showPatterns ) {
		tabs.push( patternsTab );
	}
	if ( showReusableBlocks ) {
		tabs.push( reusableBlocksTab );
	}

	return (
		<TabPanel className="block-editor-inserter__tabs" tabs={ tabs }>
			{ children }
		</TabPanel>
	);
}

export default InserterTabs;
