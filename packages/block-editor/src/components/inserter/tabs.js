/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import SidebarHeader from '../sidebar-header';
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

function InserterTabs(
	{
		showPatterns = false,
		showMedia = false,
		onSelect,
		children,
		setIsInserterOpened,
	},
	ref
) {
	const tabs = [
		blocksTab,
		showPatterns && patternsTab,
		showMedia && mediaTab,
	].filter( Boolean );

	return (
		<div className="block-editor-inserter__tabs" ref={ ref }>
			<Tabs onSelect={ onSelect }>
				<SidebarHeader
					onClose={ () => setIsInserterOpened( false ) }
					tabs={ tabs }
				/>
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
