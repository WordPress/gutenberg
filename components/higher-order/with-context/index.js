/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

const withContext = ( contextName ) => ( mapSettingsToProps ) => ( OriginalComponent ) => {
	// Allow call without explicit `mapSettingsToProps`
	if ( mapSettingsToProps instanceof Component ) {
		return withContext( contextName )()( mapSettingsToProps );
	}

	class WrappedComponent extends Component {
		render() {
			const extraProps = mapSettingsToProps ?
				mapSettingsToProps( this.context[ contextName ], this.props ) :
				this.context[ contextName ];

			return (
				<OriginalComponent
					{ ...this.props }
					{ ...extraProps }
				/>
			);
		}
	}

	WrappedComponent.contextTypes = {
		[ contextName ]: noop,
	};

	return WrappedComponent;
};

export default withContext;
