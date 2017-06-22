/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { FormToggle, withInstanceId } from 'components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

function PostSticky( { postSticky = false, instanceId, ...props } ) {
	const stickyToggleId = 'post-sticky-toggle-' + instanceId;

	const onTogglePostSticky = () => props.editPost( { sticky: !postSticky } );

	return ( 
		<div className="editor-post-status__row">
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the front page' ) }</label>
			<FormToggle
				checked={ postSticky }
				onChange={ onTogglePostSticky }
				showHint={ false }
				id={ stickyToggleId }
			/>
		</div>
	);
}

export default connect(
	( state ) => {
		return {
			postSticky: getEditedPostAttribute( state, 'sticky' ),
		};
	},
	{ editPost }
)( withInstanceId( PostSticky ) );
