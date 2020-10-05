/**
 * WordPress dependencies
 */
import { TabPanel } from '@wordpress/components';
import { memo, useMemo } from '@wordpress/element';
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
	onSelect,
} ) {
	const tabs = useMemo( () => {
		const tabList = [ blocksTab ];

		if ( showPatterns ) {
			tabList.push( patternsTab );
		}
		if ( showReusableBlocks ) {
			tabList.push( reusableBlocksTab );
		}

		return tabList;
	}, [ showPatterns, showReusableBlocks ] );

	return (
		<TabPanel
			className="block-editor-inserter__tabs"
			tabs={ tabs }
			onSelect={ onSelect }
		>
			{ children }
		</TabPanel>
	);
}

const memoizedInserterTabs = memo( InserterTabs );

export default memoizedInserterTabs;
