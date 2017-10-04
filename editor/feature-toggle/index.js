/**
 * External Dependencies
 */
import { connect } from 'react-redux';

/**
 * WordPress Dependencies
 */
import { FormToggle, withInstanceId } from '@wordpress/components';

/**
 * Internal Dependencies
 */
import './style.scss';
import { isFeatureActive } from '../selectors';
import { toggleFeature } from '../actions';

function FeatureToggle( { instanceId, label, onToggle, active } ) {
	const id = `editor-feature-toggle-${ instanceId }`;

	return (
		<div className="editor-feature-toggle">
			<label htmlFor={ id }>{ label }</label>
			<FormToggle checked={ active } onChange={ onToggle } id={ id } />
		</div>
	);
}

export default connect(
	( state, ownProps ) => ( {
		active: isFeatureActive( state, ownProps.feature ),
	} ),
	( dispatch, ownProps ) => ( {
		onToggle() {
			dispatch( toggleFeature( ownProps.feature ) );
		},
	} )
)( withInstanceId( FeatureToggle ) );
