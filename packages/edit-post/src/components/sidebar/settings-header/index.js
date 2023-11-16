/**
 * WordPress dependencies
 */
import { privateApis as componentsPrivateApis } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import { store as editPostStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

const { Tabs } = unlock( componentsPrivateApis );

const SettingsHeader = ( { sidebarName } ) => {
	const { documentLabel, isTemplateMode } = useSelect( ( select ) => {
		const { getPostTypeLabel, getRenderingMode } = select( editorStore );

		return {
			// translators: Default label for the Document sidebar tab, not selected.
			documentLabel: getPostTypeLabel() || _x( 'Document', 'noun' ),
			isTemplateMode: getRenderingMode() === 'template-only',
		};
	}, [] );

	const documentAriaLabel =
		sidebarName === 'edit-post/document'
			? // translators: ARIA label for the Document sidebar tab, selected. %s: Document label.
			  sprintf( __( '%s (selected)' ), documentLabel )
			: documentLabel;

	const blockAriaLabel =
		sidebarName === 'edit-post/block'
			? // translators: ARIA label for the Block Settings Sidebar tab, selected.
			  __( 'Block (selected)' )
			: // translators: ARIA label for the Block Settings Sidebar tab, not selected.
			  __( 'Block' );

	const templateAriaLabel =
		sidebarName === 'edit-post/document'
			? __( 'Template (selected)' )
			: __( 'Template' );

	return (
		<>
			<Tabs.TabList>
				<Tabs.Tab
					id={ 'edit-post/document' }
					aria-label={
						isTemplateMode ? templateAriaLabel : documentAriaLabel
					}
					data-label={
						isTemplateMode ? __( 'Template' ) : documentLabel
					}
				>
					{ isTemplateMode ? __( 'Template' ) : documentLabel }
				</Tabs.Tab>
				<Tabs.Tab
					id={ 'edit-post/block' }
					aria-label={ blockAriaLabel }
					// translators: Data label for the Block Settings Sidebar tab.
					data-label={ __( 'Block' ) }
				>
					{ /* translators: Text label for the Block Settings Sidebar tab. */ }
					{ __( 'Block' ) }
				</Tabs.Tab>
			</Tabs.TabList>
		</>
	);
};

export default SettingsHeader;
