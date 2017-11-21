/**
 * External dependencies
 */
import { map } from 'lodash';

/**
 * WordPress dependencies
 */
import { Fill, withHooks } from '@wordpress/components';
import { Component } from '@wordpress/element';

class PluginFills extends Component {
	constructor() {
		super( ...arguments );

		this.registerFill = this.registerFill.bind( this );

		this.state = {
			fills: {},
		};
	}

	componentDidMount() {
		this.props.hooks.addAction( 'registerFill', 'core\plugin-fills-register', this.registerFill );
	}

	componentWillUnmount() {
		this.props.hooks.removeAction( 'registerFill', 'core\plugin-fills-register' );
	}

	registerFill( name, FillComponent ) {
		this.setState( ( prevState ) => {
			const { fills } = prevState;

			return {
				fills: {
					...fills,
					[ name ]: [
						...( fills[ name ] || [] ),
						FillComponent,
					],
				},
			};
		} );
	}

	render() {
		return map( this.state.fills, ( components, name ) => (
			<Fill key={ name } name={ name }>
				{ map( components, ( FillComponent, index ) => (
					<FillComponent key={ index } />
				) ) }
			</Fill>
		) );
	}
}

export default withHooks( PluginFills );
