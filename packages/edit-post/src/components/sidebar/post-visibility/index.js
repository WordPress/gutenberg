/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, Button } from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
} from '@wordpress/editor';

export function PostVisibility() {
	return (
		<PostVisibilityCheck
			render={ ( { canEdit } ) => (
				<PanelRow className="edit-post-post-visibility">
					<span>{ __( 'Visibility' ) }</span>
					{ ! canEdit && (
						<span>
							<PostVisibilityLabel />
						</span>
					) }
					{ canEdit && (
						<Dropdown
							position="bottom left"
							contentClassName="edit-post-post-visibility__dialog"
							renderToggle={ ( { isOpen, ref } ) => (
								<Button
									ref={ ref }
									aria-expanded={ isOpen }
									className="edit-post-post-visibility__toggle"
									isTertiary
								>
									<PostVisibilityLabel />
								</Button>
							) }
							renderContent={ () => <PostVisibilityForm /> }
						/>
					) }
				</PanelRow>
			) }
		/>
	);
}

export default PostVisibility;
