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
import { PostTaxonomies } from '@wordpress/editor';

/**
 * Internal dependencies
 */
import Section from './section';
import { EnablePublishSidebarOption, EnableTipsOption, EnablePanelOption } from './options';

const MODAL_NAME = 'edit-post/options';

export function OptionsModal( { isModalActive, closeModal } ) {
	if ( ! isModalActive ) {
		return null;
	}

	return (
		<Modal
			className="edit-post-options-modal"
			title={ <span className="edit-post-options-modal__title">{ __( 'Options' ) }</span> }
			closeLabel={ __( 'Close' ) }
			onRequestClose={ closeModal }
		>
			<Section title={ __( 'General' ) }>
				<EnablePublishSidebarOption label={ __( 'Enable Pre-publish Checks' ) } />
				<EnableTipsOption label={ __( 'Enable Tips' ) } />
			</Section>
			<Section title={ __( 'Document Panels' ) }>
				<EnablePanelOption panelName="post-status" label={ __( 'Status & Visibility' ) } />
				<PostTaxonomies
					taxonomyWrapper={ ( content, taxonomy ) => (
						<EnablePanelOption
							label={ get( taxonomy, [ 'labels', 'menu_name' ] ) }
							panelName={ `taxonomy-panel-${ taxonomy.slug }` }
						/>
					) }
				/>
				<EnablePanelOption label={ __( 'Featured Image' ) } panelName="featured-image" />
				<EnablePanelOption label={ __( 'Excerpt' ) } panelName="post-excerpt" />
				<EnablePanelOption label={ __( 'Discussion' ) } panelName="discussion-panel" />
			</Section>
		</Modal>
	);
}

export default compose(
	withSelect( ( select ) => ( {
		isModalActive: select( 'core/edit-post' ).isModalActive( MODAL_NAME ),
	} ) ),
	withDispatch( ( dispatch ) => {
		return {
			closeModal: () => dispatch( 'core/edit-post' ).closeModal(),
		};
	} )
)( OptionsModal );
