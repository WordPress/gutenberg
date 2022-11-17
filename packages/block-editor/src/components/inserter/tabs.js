/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
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

function InserterTabs( {
	children,
	showPatterns = false,
	onSelect,
	prioritizePatterns,
} ) {
	const tabs = useMemo( () => {
		const tempTabs = [];
		if ( prioritizePatterns && showPatterns ) {
			tempTabs.push( patternsTab );
		}
		tempTabs.push( blocksTab );
		if ( ! prioritizePatterns && showPatterns ) {
			tempTabs.push( patternsTab );
		}
		return tempTabs;
	}, [ prioritizePatterns, blocksTab, showPatterns, patternsTab ] );

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

export default InserterTabs;
