/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dashicon, PanelBody } from '@wordpress/components';

import FlatTermSelector from '../post-taxonomies/flat-term-selector';

const MaybeTagsPanel = () => <PanelBody initialOpen={ true } title={ [
	<Dashicon key={ 'dashicon-lightbulb' } icon={ 'lightbulb' } />,
	__( 'Tip:' ),
	<span className="editor-post-publish-panel__link" key="label">{
		__( 'Add tags to your post' )
	}</span>,
] }>
	<FlatTermSelector slug={ 'post_tag' } />
</PanelBody>;

export default MaybeTagsPanel;
