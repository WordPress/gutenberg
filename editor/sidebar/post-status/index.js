/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import PanelBody from 'components/panel/body';
import FormToggle from 'components/form-toggle';

/**
 * Internal Dependencies
 */
import './style.scss';
function PostStatus() {
	return (
		<PanelBody title={ __( 'Status & Visibility' ) }>
			<div className="editor-post-status__row">
				<span>{ __( 'Pending review' ) }</span>
				<FormToggle />
			</div>
		</PanelBody>
	);
}

export default PostStatus;
