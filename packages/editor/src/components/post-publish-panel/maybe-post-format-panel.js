/**
 * WordPress dependencies.
 */
import { __ } from '@wordpress/i18n';
import { withSelect } from '@wordpress/data';
import { Dashicon, PanelBody } from '@wordpress/components';

/**
 * Internal dependencies.
 */
import PostFormat from '../post-format';

const MaybePostFormatPanel = ( { currentPostFormat, suggestedPostFormat } ) => suggestedPostFormat &&
	suggestedPostFormat !== currentPostFormat &&
	<PanelBody initialOpen={ false } title={ [
		<Dashicon key={ 'dashicon-lightbulb' } icon={ 'lightbulb' } />,
		__( 'Tip:' ),
		<span className="editor-post-publish-panel__link" key="label">{
			__( 'Choose a fitting post format' )
		}</span>,
	] } >
		<PostFormat />
	</PanelBody>;

export default withSelect(
	( select ) => {
		const { getEditedPostAttribute, getSuggestedPostFormat } = select( 'core/editor' );
		return {
			suggestedPostFormat: getSuggestedPostFormat(),
			currentPostFormat: getEditedPostAttribute( 'format' ),
		};
	}
)( MaybePostFormatPanel );
