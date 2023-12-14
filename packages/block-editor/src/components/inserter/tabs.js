/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

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
	showPatterns = false,
	showMedia = false,
	onSelect,
	prioritizePatterns,
	tabsContents,
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
		if ( showMedia ) {
			tempTabs.push( mediaTab );
		}
		return tempTabs;
	}, [ prioritizePatterns, showPatterns, showMedia ] );

	return (
		<div className="block-editor-inserter__tabs">
			<Tabs onSelect={ onSelect }>
				<Tabs.TabList>
					{ tabs.map( ( tab ) => (
						<Tabs.Tab key={ tab.name } tabId={ tab.name }>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.TabList>
				{ tabs.map( ( tab ) => (
					<Tabs.TabPanel
						key={ tab.name }
						tabId={ tab.name }
						focusable={ false }
					>
						{ tabsContents[ tab.name ] }
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</div>
	);
}

export default InserterTabs;
