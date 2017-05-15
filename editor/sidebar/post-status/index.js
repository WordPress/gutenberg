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
		<PanelBody toggle={ __( 'Status & Visibility' ) }>
			<div>
				<div className="editor-sidebar-post-status__row">
					<span>{ __( 'Pending review' ) }</span>
					<FormToggle
						checked={ false }
						aria-label={ __( 'Request review for post' ) }
					/>
				</div>
			</div>
		</PanelBody>
	);
}

export default PostStatus;
