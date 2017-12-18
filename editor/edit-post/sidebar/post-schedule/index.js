/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelRow, Dropdown, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './style.scss';
import { PostSchedule as PostScheduleForm, PostScheduleLabel } from '../../../components';
import { getCurrentPostType } from '../../../selectors';

export function PostSchedule( { user } ) {
	const userCanPublishPosts = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	if ( ! userCanPublishPosts ) {
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

const applyConnect = connect(
	( state ) => {
		return {
			postType: getCurrentPostType( state ),
		};
	},
);

const applyWithAPIData = withAPIData( ( props ) => {
	const { postType } = props;

	return {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	};
} );

export default compose( [
	applyConnect,
	applyWithAPIData,
] )( PostSchedule );
