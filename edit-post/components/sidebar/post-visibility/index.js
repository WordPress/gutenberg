/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown } from '@wordpress/components';
import { PostVisibility as PostVisibilityForm, PostVisibilityLabel, PostVisibilityCheck } from '@wordpress/editor';

/**
 * Internal Dependencies
 */
import './style.scss';

export function PostVisibility() {
	return (
		<PostVisibilityCheck render={ ( { canEdit } ) => (
			<PanelRow className="edit-post-post-visibility">
				<span>{ __( 'Visibility' ) }</span>
				{ ! canEdit && <span><PostVisibilityLabel /></span> }
				{ canEdit && (
					<Dropdown
						position="bottom left"
						contentClassName="edit-post-post-visibility__dialog"
						renderToggle={ ( { isOpen, onToggle } ) => (
							<button
								type="button"
								aria-expanded={ isOpen }
								className="edit-post-post-visibility__toggle button-link"
								onClick={ onToggle }
							>
								<PostVisibilityLabel />
							</button>
						) }
						renderContent={ () => <PostVisibilityForm /> }
					/>
				) }
			</PanelRow>
		) } />
	);
}

export default PostVisibility;
