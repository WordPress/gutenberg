/**
 * External dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import PanelBody from 'components/panel/body';
import FormToggle from 'components/form-toggle';

/**
 * Internal Dependencies
 */
import './style.scss';
import { getEditedPostStatus } from '../../selectors';
import { editPost } from '../../actions';

function PostStatus( { status, onUpdateStatus } ) {
	const onToggle = () => {
		const updatedStatus = status === 'pending' ? 'draft' : 'pending';
		onUpdateStatus( updatedStatus );
	};

	return (
		<PanelBody title={ __( 'Status & Visibility' ) }>
			<div className="editor-post-status__row">
				<span>{ __( 'Pending review' ) }</span>
				<FormToggle
					checked={ status === 'pending' }
					onChange={ onToggle }
				/>
			</div>
		</PanelBody>
	);
}

export default connect(
	( state ) => ( {
		status: getEditedPostStatus( state ),
	} ),
	( dispatch ) => {
		return {
			onUpdateStatus( status ) {
				dispatch( editPost( { status } ) );
			},
		};
	}
)( PostStatus );

