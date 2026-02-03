/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { forwardRef } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { ATTACHMENT_POST_TYPE } from '../../store/constants';
import { unlock } from '../../lock-unlock';
import { sidebars } from './constants';

const { Tabs } = unlock( componentsPrivateApis );

const SidebarHeader = ( _, ref ) => {
	const { postTypeLabel, isAttachment, isRevisionsMode } = useSelect(
		( select ) => {
			const { getPostTypeLabel, getCurrentPostType } =
				select( editorStore );
			const { isRevisionsMode: _isRevisionsMode } = unlock(
				select( editorStore )
			);
			return {
				postTypeLabel: getPostTypeLabel(),
				isAttachment:
					getCurrentPostType() === ATTACHMENT_POST_TYPE &&
					window?.__experimentalMediaEditor,
				isRevisionsMode: _isRevisionsMode(),
			};
		},
		[]
	);

	let documentLabel;
	if ( isRevisionsMode ) {
		documentLabel = __( 'Revision' );
	} else if ( postTypeLabel ) {
		documentLabel = decodeEntities( postTypeLabel );
	} else {
		// translators: Default label for the Document sidebar tab, not selected.
		documentLabel = _x( 'Document', 'noun, panel' );
	}

	return (
		<Tabs.TabList ref={ ref }>
			<Tabs.Tab
				tabId={ sidebars.document }
				// Used for focus management in the SettingsSidebar component.
				data-tab-id={ sidebars.document }
			>
				{ documentLabel }
			</Tabs.Tab>
			{ ! isAttachment && ! isRevisionsMode && (
				<Tabs.Tab
					tabId={ sidebars.block }
					// Used for focus management in the SettingsSidebar component.
					data-tab-id={ sidebars.block }
				>
					{ /* translators: Text label for the Block Settings Sidebar tab. */ }
					{ __( 'Block' ) }
				</Tabs.Tab>
			) }
		</Tabs.TabList>
	);
};

export default forwardRef( SidebarHeader );
