/**
 * External dependencies
 */
import { noop } from 'lodash-es';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { createHigherOrderComponent } from '@wordpress/compose';
import deprecated from '@wordpress/deprecated';

export default ( contextName ) => ( mapSettingsToProps ) => createHigherOrderComponent(
	( OriginalComponent ) => {
		deprecated( 'wp.components.withContext', {
			version: '3.8',
			alternative: 'wp.element.createContext',
			plugin: 'Gutenberg',
			hint: 'https://reactjs.org/docs/context.html',
		} );

		class WrappedComponent extends Component {
			render() {
				const extraProps = mapSettingsToProps ?
					mapSettingsToProps( this.context[ contextName ], this.props ) :
					{ [ contextName ]: this.context[ contextName ] };

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
	},
	'withContext'
);
