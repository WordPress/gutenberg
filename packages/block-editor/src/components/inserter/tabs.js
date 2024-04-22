/**
 * WordPress dependencies
 */
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
	tabsContents,
} ) {
	const tabs = [
		blocksTab,
		showPatterns && patternsTab,
		showMedia && mediaTab,
	].filter( Boolean );

	return (
		<div className="block-editor-inserter__tabs">
			<Tabs onSelect={ onSelect }>
				<Tabs.TabList className="block-editor-inserter__tablist">
					{ tabs.map( ( tab ) => (
						<Tabs.Tab
							key={ tab.name }
							tabId={ tab.name }
							className="block-editor-inserter__tab"
						>
							{ tab.title }
						</Tabs.Tab>
					) ) }
				</Tabs.TabList>
				{ tabs.map( ( tab ) => (
					<Tabs.TabPanel
						key={ tab.name }
						tabId={ tab.name }
						focusable={ false }
						className="block-editor-inserter__tabpanel"
					>
						{ tabsContents[ tab.name ] }
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</div>
	);
}

export default InserterTabs;
