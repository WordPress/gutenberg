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
const reusableBlocksTab = {
	name: 'reusable',
	/* translators: Reusable blocks tab title in the block inserter. */
	title: __( 'Reusable' ),
};
const externalImagesTab = {
	name: 'external-images',
	/* translators: Images tab title in the block inserter. */
	title: __( 'Images' ),
};

function InserterTabs( {
	children,
	showPatterns = false,
	showReusableBlocks = false,
	showExternalImages = false,
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
		if ( showReusableBlocks ) {
			tempTabs.push( reusableBlocksTab );
		}
		if ( showExternalImages ) {
			tempTabs.push( externalImagesTab );
		}

		return tempTabs;
	}, [
		prioritizePatterns,
		blocksTab,
		showPatterns,
		patternsTab,
		showReusableBlocks,
		reusableBlocksTab,
		showExternalImages,
		externalImagesTab,
	] );

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
