/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostSchedule as PostScheduleForm, PostScheduleLabel } from '../../../components';

export function PostSchedule( { user } ) {
	const userCaps = user.data ?
		{ ...user.data.capabilities, ...user.data.post_type_capabilities } :
		{ 'publish_posts': false };

	if ( ! userCaps.publish_posts ) {
		return null;
	}

	return (
		<PanelRow className="editor-post-schedule">
			<span>{ __( 'Publish' ) }</span>
			<Dropdown
				position="bottom left"
				contentClassName="editor-post-schedule__dialog"
				renderToggle={ ( { onToggle, isOpen } ) => (
					<button
						type="button"
						className="editor-post-schedule__toggle button-link"
						onClick={ onToggle }
						aria-expanded={ isOpen }
					>
						<PostScheduleLabel />
					</button>
				) }
				renderContent={ () => <PostScheduleForm /> }
			/>
		</PanelRow>
	);
}

export default withAPIData( () => {
	const postTypeSlug = window._wpGutenbergPost.type;

	return {
		user: `/wp/v2/users/me?post_type=${ postTypeSlug }&context=edit`,
	};
} )( PostSchedule );
