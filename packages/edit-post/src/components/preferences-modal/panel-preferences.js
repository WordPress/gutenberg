/**
 * External dependencies
 */
import { get, filter, map } from 'lodash';

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
	EnableCustomFieldsOption,
	EnablePluginDocumentSettingPanelOption,
	EnablePanelOption,
} from './options';
import { store as editPostStore } from '../../store';

export function MetaBoxesSection() {
	const { areCustomFieldsRegistered, metaBoxes } = useSelect( ( select ) => {
		const { getEditorSettings } = select( editorStore );
		const { getAllMetaBoxes } = select( editPostStore );

		return {
			// This setting should not live in the block editor's store.
			areCustomFieldsRegistered:
				getEditorSettings().enableCustomFields !== undefined,
			metaBoxes: getAllMetaBoxes(),
		};
	} );
	// The 'Custom Fields' meta box is a special case that we handle separately.
	const thirdPartyMetaBoxes = filter(
		metaBoxes,
		( { id } ) => id !== 'postcustom'
	);

	if ( ! areCustomFieldsRegistered && thirdPartyMetaBoxes.length === 0 ) {
		return null;
	}

	return (
		<PreferencesModalSection
			title={ __( 'Additional' ) }
			description={ __( 'Add extra areas to the editor.' ) }
		>
			{ areCustomFieldsRegistered && (
				<EnableCustomFieldsOption label={ __( 'Custom fields' ) } />
			) }
			{ map( thirdPartyMetaBoxes, ( { id, title } ) => (
				<EnablePanelOption
					key={ id }
					label={ title }
					panelName={ `meta-box-${ id }` }
				/>
			) ) }
		</PreferencesModalSection>
	);
}

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
			<MetaBoxesSection />
		</>
	);
}
