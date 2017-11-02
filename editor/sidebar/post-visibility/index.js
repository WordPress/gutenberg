/**
 * External dependencies
 */
import { flowRight } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostVisibilityLabel from '../../post-visibility/label';
import PostVisibilityForm from '../../post-visibility';

export function PostVisibility( { user, instanceId } ) {
	const canEdit = user.data && user.data.capabilities.publish_posts;
	const postVisibilitySelectorId = 'post-visibility-selector-' + instanceId;

	return (
		<PanelRow className="editor-post-visibility">
			<label htmlFor={ postVisibilitySelectorId }>{ __( 'Visibility' ) }</label>
			{ ! canEdit && <span><PostVisibilityLabel /></span> }
			{ canEdit && (
				<Dropdown
					position="bottom left"
					contentClassName="editor-post-visibility__dialog"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button
							id={ postVisibilitySelectorId }
							type="button"
							aria-expanded={ isOpen }
							className="editor-post-visibility__toggle button-link"
							onClick={ onToggle }
						>
							<PostVisibilityLabel />
						</button>
					) }
					renderContent={ () => <PostVisibilityForm /> }
				/>
			) }
		</PanelRow>
	);
}

export default flowRight( [
	withAPIData( () => {
		return {
			user: '/wp/v2/users/me?context=edit',
		};
	} ),
	withInstanceId,
] )( PostVisibility );
