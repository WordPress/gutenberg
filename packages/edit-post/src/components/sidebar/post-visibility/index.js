/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Button } from '@wordpress/components';
import {
	PostVisibility as PostVisibilityForm,
	PostVisibilityLabel,
	PostVisibilityCheck,
} from '@wordpress/editor';
import { CardBody, Popover } from '@wordpress/ui.components';

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
						<Popover
							placement="bottom-end"
							maxWidth={ 260 }
							trigger={
								<Button
									className="edit-post-post-visibility__toggle"
									version="next"
									isTertiary
								>
									<PostVisibilityLabel />
								</Button>
							}
						>
							<CardBody>
								<PostVisibilityForm />
							</CardBody>
						</Popover>
					) }
				</PanelRow>
			) }
		/>
	);
}

export default PostVisibility;
