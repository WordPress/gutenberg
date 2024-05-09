/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unlock } from '../../lock-unlock';
import { sidebars } from './constants';

const { Tabs } = unlock( componentsPrivateApis );

const SidebarHeader = ( _, ref ) => {
	const { documentLabel } = useSelect( ( select ) => {
		const { getPostTypeLabel } = select( editorStore );

		return {
			// translators: Default label for the Document sidebar tab, not selected.
			documentLabel: getPostTypeLabel() || _x( 'Document', 'noun' ),
		};
	}, [] );

	return (
		<Tabs.TabList ref={ ref }>
			<Tabs.Tab
				tabId={ sidebars.document }
				// Used for focus management in the SettingsSidebar component.
				data-tab-id={ sidebars.document }
			>
				{ documentLabel }
			</Tabs.Tab>
			<Tabs.Tab
				tabId={ sidebars.block }
				// Used for focus management in the SettingsSidebar component.
				data-tab-id={ sidebars.block }
			>
				{ /* translators: Text label for the Block Settings Sidebar tab. */ }
				{ __( 'Block' ) }
			</Tabs.Tab>
		</Tabs.TabList>
	);
};

export default forwardRef( SidebarHeader );
