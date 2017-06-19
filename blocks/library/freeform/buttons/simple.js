/**
 * External dependencies
 */
import classnames from 'classnames';
import { find } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Button, TinymceIcon } from 'components';

class SimpleButton extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			isActive: false,
			isDisabled: false,
		};
		this.mounted = true;
	}

	componentDidMount() {
		const { button } = this.props;
		const fnNames = [ 'onPostRender', 'onpostrender', 'OnPostRender' ];
		const onPostRender = find( fnNames, ( fn ) => button.hasOwnProperty( fn ) );
		if ( onPostRender ) {
			button[ onPostRender ].call( {
				active: ( isActive ) => this.mounted && this.setState( { isActive } ),
				disabled: ( isDisabled ) => this.mounted && this.setState( { isDisabled } ),
			} );
		}
	}

	componentWillUnmount() {
		this.mounted = false;
	}

	render() {
		const { button } = this.props;
		const { isActive, isDisabled } = this.state;

		return (
			<Button
				label={ button.text }
				onClick={ button.onclick }
				className={ classnames( 'components-toolbar__control', {
					'is-active': isActive,
				} ) }
				aria-pressed={ isActive }
				disabled={ isDisabled }
			>
				{ button.icon && <TinymceIcon icon={ button.icon } /> }
				{ button.text }
			</Button>
		);
	}
}

export default SimpleButton;
