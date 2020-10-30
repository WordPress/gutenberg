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
import { ContextSystemProvider } from '@wordpress/ui.context';

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
					<ContextSystemProvider
						value={ { WPComponentsButton: { version: 'next' } } }
					>
						{ canEdit && (
							<Dropdown
								position="bottom left"
								contentClassName="edit-post-post-visibility__dialog"
								renderToggle={ ( { isOpen, onToggle } ) => (
									<Button
										aria-expanded={ isOpen }
										className="edit-post-post-visibility__toggle"
										onClick={ onToggle }
										isTertiary
									>
										<PostVisibilityLabel />
									</Button>
								) }
								renderContent={ () => <PostVisibilityForm /> }
							/>
						) }
					</ContextSystemProvider>
				</PanelRow>
			) }
		/>
	);
}

export default PostVisibility;
