/**
 * WordPress dependencies
 */
import { Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import PostVisibility from '../post-visibility';
import PostSchedule from '../post-schedule';

const panel = (
	<Panel>
		<PanelBody>
			<div><strong>{ __( 'All ready to go?' ) }</strong></div>
			<PostVisibility />
			<PostSchedule />
		</PanelBody>
	</Panel>
);

export default () => panel;
