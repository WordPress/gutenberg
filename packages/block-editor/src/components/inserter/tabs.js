/**
 * WordPress dependencies
 */
import {
	Button,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';
import { closeSmall } from '@wordpress/icons';

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

function InserterTabs( { onSelect, children, onClose, selectedTab }, ref ) {
	const tabs = [ blocksTab, patternsTab, mediaTab ];

	return (
		<div className="block-editor-inserter__tabs" ref={ ref }>
			<Tabs onSelect={ onSelect } selectedTabId={ selectedTab }>
				<div className="block-editor-inserter__tablist-and-close-button">
					<Button
						className="block-editor-inserter__close-button"
						icon={ closeSmall }
						label={ __( 'Close block inserter' ) }
						onClick={ () => onClose() }
						size="small"
					/>

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
				</div>
				{ tabs.map( ( tab ) => (
					<Tabs.TabPanel
						key={ tab.name }
						tabId={ tab.name }
						focusable={ false }
						className="block-editor-inserter__tabpanel"
					>
						{ children }
					</Tabs.TabPanel>
				) ) }
			</Tabs>
		</div>
	);
}

export default forwardRef( InserterTabs );
