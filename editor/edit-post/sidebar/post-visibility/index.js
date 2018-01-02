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
 * Internal Dependencies
 */
import './style.scss';
import { PostVisibility as PostVisibilityForm, PostVisibilityLabel } from '../../../components';
import { getCurrentPostType } from '../../../store/selectors';

export function PostVisibility( { user } ) {
	const canEdit = get( user.data, [ 'post_type_capabilities', 'publish_posts' ], false );

	return (
		<PanelRow className="editor-post-visibility">
			<span>{ __( 'Visibility' ) }</span>
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
] )( PostVisibility );
