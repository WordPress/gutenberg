/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { Modal } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import {
	PostTaxonomies,
	PostExcerptCheck,
	PageAttributesCheck,
	PostFeaturedImageCheck,
	PostTypeSupportCheck,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Section from './section';
import {
	EnablePluginDocumentSettingPanelOption,
	EnablePublishSidebarOption,
	EnablePanelOption,
	EnableFeature,
} from './options';
import MetaBoxesSection from './meta-boxes-section';

const MODAL_NAME = 'edit-post/preferences';

export function PreferencesModal( { isModalActive, isViewable, closeModal } ) {
	if ( ! isModalActive ) {
		return null;
	}
	return (
		<Modal
			className="edit-post-preferences-modal"
			title={ __( 'Preferences' ) }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
		>
			<Section title={ __( 'General' ) }>
				<EnablePublishSidebarOption
					help={ __(
						'Review settings such as categories and tags.'
					) }
					label={ __( 'Include pre-publish checklist' ) }
				/>
				<EnableFeature
					featureName="mostUsedBlocks"
					help={ __(
						'Places the most frequent blocks in the block library.'
					) }
					label={ __( 'Show most used blocks' ) }
				/>
			</Section>
			<Section title={ __( 'Keyboard' ) }>
				<EnableFeature
					featureName="keepCaretInsideBlock"
					help={ __(
						'Aids screen readers by stopping text caret from leaving blocks.'
					) }
					label={ __( 'Contain text cursor inside block.' ) }
				/>
			</Section>
			<Section title={ __( 'Appearance' ) }>
				<EnableFeature
					featureName="reducedUI"
					help={ __(
						'Compacts options and outlines in the toolbar.'
					) }
					label={ __( 'Reduce the interface' ) }
				/>
				<EnableFeature
					featureName="focusMode"
					help={ __(
						'Highlights the current block and fades other content.'
					) }
					label={ __( 'Spotlight mode' ) }
				/>
				<EnableFeature
					featureName="showIconLabels"
					help={ __( 'Shows text instead of icons in toolbar.' ) }
					label={ __( 'Display button labels' ) }
				/>
				<EnableFeature
					featureName="themeStyles"
					help={ __( 'Make the editor look like your theme.' ) }
					label={ __( 'Use theme styles' ) }
				/>
			</Section>
			<Section
				title={ __( 'Document settings' ) }
				description={ __( 'Choose what displays in the panel.' ) }
			>
				<EnablePluginDocumentSettingPanelOption.Slot />
				{ isViewable && (
					<EnablePanelOption
						label={ __( 'Permalink' ) }
						panelName="post-link"
					/>
				) }
				<PostTaxonomies
					taxonomyWrapper={ ( content, taxonomy ) => (
						<EnablePanelOption
							label={ get( taxonomy, [ 'labels', 'menu_name' ] ) }
							panelName={ `taxonomy-panel-${ taxonomy.slug }` }
						/>
					) }
				/>
				<PostFeaturedImageCheck>
					<EnablePanelOption
						label={ __( 'Featured image' ) }
						panelName="featured-image"
					/>
				</PostFeaturedImageCheck>
				<PostExcerptCheck>
					<EnablePanelOption
						label={ __( 'Excerpt' ) }
						panelName="post-excerpt"
					/>
				</PostExcerptCheck>
				<PostTypeSupportCheck
					supportKeys={ [ 'comments', 'trackbacks' ] }
				>
					<EnablePanelOption
						label={ __( 'Discussion' ) }
						panelName="discussion-panel"
					/>
				</PostTypeSupportCheck>
				<PageAttributesCheck>
					<EnablePanelOption
						label={ __( 'Page attributes' ) }
						panelName="page-attributes"
					/>
				</PageAttributesCheck>
			</Section>
			<MetaBoxesSection
				title={ __( 'Additional panels' ) }
				description={ __( 'Add extra areas to the editor.' ) }
			/>
		</Modal>
	);
}

export default compose(
	withSelect( ( select ) => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getPostType } = select( 'core' );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );

		return {
			isModalActive: select( 'core/edit-post' ).isModalActive(
				MODAL_NAME
			),
			isViewable: get( postType, [ 'viewable' ], false ),
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			closeModal: () => dispatch( 'core/edit-post' ).closeModal(),
		};
	} )
)( PreferencesModal );
