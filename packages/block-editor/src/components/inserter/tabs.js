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
	/* translators: Theme and Directory Patterns tab title in the block inserter. */
	title: __( 'Patterns' ),
};

const mediaTab = {
	name: 'media',
	/* translators: Media tab title in the block inserter. */
	title: __( 'Media' ),
};

function InserterTabs( {
	children,
	showPatterns = false,
	showMedia = false,
	onSelect,
} ) {
	const tabs = useMemo( () => {
		const tempTabs = [];
		tempTabs.push( blocksTab );
		if ( showPatterns ) {
			tempTabs.push( patternsTab );
		}
		if ( showMedia ) {
			tempTabs.push( mediaTab );
		}
		return tempTabs;
	}, [ showPatterns, showMedia ] );

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
