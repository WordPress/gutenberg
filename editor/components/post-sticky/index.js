/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToggleControl } from '@wordpress/components';
import { compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';
import PostStickyCheck from './check';

export function PostSticky( { onUpdateSticky, postSticky = false } ) {
	return (
		<PostStickyCheck>
			<ToggleControl
				key="toggle"
				label={ __( 'Stick to the Front Page' ) }
				checked={ postSticky }
				onChange={ () => onUpdateSticky( ! postSticky ) }
				showHint={ false }
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
] )( PostSticky );
