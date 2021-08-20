/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import {
	PostTaxonomies,
	PostExcerptCheck,
	PageAttributesCheck,
	PostFeaturedImageCheck,
	PostTypeSupportCheck,
	store as editorStore,
} from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { PreferencesModalSection } from '@wordpress/interface';

/**
 * Internal dependencies
 */
import {
	EnablePluginDocumentSettingPanelOption,
	EnablePanelOption,
} from './options';
import MetaBoxesSection from './meta-boxes-section';

export default function PanelPreferences() {
	const isViewable = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const { getPostType } = select( coreStore );
		const postType = getPostType( getEditedPostAttribute( 'type' ) );
		return get( postType, [ 'viewable' ], false );
	}, [] );

	return (
		<>
			<PreferencesModalSection
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
				{ isViewable && (
					<EnablePanelOption
						label={ __( 'Template' ) }
						panelName="template"
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
			</PreferencesModalSection>
			<PreferencesModalSection
				title={ __( 'Additional' ) }
				description={ __( 'Add extra areas to the editor.' ) }
			>
				<MetaBoxesSection />
			</PreferencesModalSection>
		</>
	);
}
