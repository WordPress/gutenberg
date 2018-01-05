/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormToggle, withInstanceId } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';
import PostStickyCheck from './check';

export function PostSticky( { onUpdateSticky, postSticky = false, instanceId } ) {
	const stickyToggleId = 'post-sticky-toggle-' + instanceId;

	return (
		<PostStickyCheck>
			<label htmlFor={ stickyToggleId }>{ __( 'Stick to the Front Page' ) }</label>
			<FormToggle
				key="toggle"
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
				showHint={ false }
				id={ stickyToggleId }
			/>
		</PostStickyCheck>
	);
}

const applyConnect = connect(
	( state ) => {
		return {
			postSticky: getEditedPostAttribute( state, 'sticky' ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateSticky( postSticky ) {
				dispatch( editPost( { sticky: postSticky } ) );
			},
		};
	},
);

export default compose( [
	applyConnect,
	withInstanceId,
] )( PostSticky );
