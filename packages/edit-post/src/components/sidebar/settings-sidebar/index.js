/**
 * WordPress dependencies
 */
import { Panel, ToggleControl, RangeControl } from '@wordpress/components';
import { compose, ifCondition } from '@wordpress/compose';
import { withSelect } from '@wordpress/data';
import { BlockInspector, __experimentalSimulateMediaQuery } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import Sidebar from '../';
import SettingsHeader from '../settings-header';
import PostStatus from '../post-status';
import LastRevision from '../last-revision';
import PostTaxonomies from '../post-taxonomies';
import FeaturedImage from '../featured-image';
import PostExcerpt from '../post-excerpt';
import PostLink from '../post-link';
import DiscussionPanel from '../discussion-panel';
import PageAttributes from '../page-attributes';
import MetaBoxes from '../../meta-boxes';
import PluginDocumentSettingPanel from '../plugin-document-setting-panel';

const PARTIAL_PATHS = [
	//'block-editor/style.css',
	'block-library/style.css',
	'block-library/theme.css',
	'block-library/editor.css',
	//'format-library/style.css',
];
function TestSimulateMediaQuery() {
	const [ simulationWidth, setSimulationWidth ] = useState( 400 );
	const [ isSimulationEnable, setIsSimulationEnabled ] = useState( true );
	const toggleUI = (
		<ToggleControl
			label={ __( 'Enabled width simulation' ) }
			checked={ isSimulationEnable }
			onChange={ ( newValue ) => setIsSimulationEnabled( newValue ) }
		/>
	);
	if ( ! isSimulationEnable ) {
		return toggleUI;
	}
	return (
		<>
			{ toggleUI }
			<RangeControl
				value={ simulateValue }
				label={ __( 'Simulated width value' ) }
				min={ 0 }
				max={ 2000 }
				allowReset
				onChange={ ( newValue ) => ( setSimulateValue( newValue ) ) }
			/>
			<__experimentalSimulateMediaQuery
				value={ simulateValue }
				partialPaths={ PARTIAL_PATHS }
			/>
		</>
	);
}

const SettingsSidebar = ( { sidebarName } ) => (
	<Sidebar name={ sidebarName }>
		<SettingsHeader sidebarName={ sidebarName } />
		<Panel>
			{ sidebarName === 'edit-post/document' && (
				<>
					<PostStatus />
					<PluginDocumentSettingPanel.Slot />
					<LastRevision />
					<PostLink />
					<PostTaxonomies />
					<FeaturedImage />
					<PostExcerpt />
					<DiscussionPanel />
					<PageAttributes />
					<MetaBoxes location="side" />
				</>
			) }
			{ sidebarName === 'edit-post/block' && (
				<BlockInspector />
			) }
			<TestSimulateMediaQuery />
		</Panel>
	</Sidebar>
);

export default compose(
	withSelect( ( select ) => {
		const {
			getActiveGeneralSidebarName,
			isEditorSidebarOpened,
		} = select( 'core/edit-post' );

		return {
			isEditorSidebarOpened: isEditorSidebarOpened(),
			sidebarName: getActiveGeneralSidebarName(),
		};
	} ),
	ifCondition( ( { isEditorSidebarOpened } ) => isEditorSidebarOpened ),
)( SettingsSidebar );
