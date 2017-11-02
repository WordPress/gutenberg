/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import PostVisibilityLabel from '../../post-visibility/label';
import PostVisibilityForm from '../../post-visibility';

export function PostVisibility( { user } ) {
	const canEdit = user.data && user.data.capabilities.publish_posts;
	const visibilityId = 'post-visibility-selector';

	return (
		<PanelRow className="editor-post-visibility">
			<label htmlFor={ visibilityId }>{ __( 'Visibility' ) }</label>
			{ ! canEdit && <span><PostVisibilityLabel /></span> }
			{ canEdit && (
				<Dropdown
					position="bottom left"
					contentClassName="editor-post-visibility__dialog"
					renderToggle={ ( { isOpen, onToggle } ) => (
						<button
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

export default withAPIData( () => {
	return {
		user: '/wp/v2/users/me?context=edit',
	};
} )( PostVisibility );
