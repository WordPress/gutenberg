/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { AddOutlineIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import Inserter from './';


export default class InserterButtonComponent extends Component {
	static defaultProps = {
		onAdd: () => {}
	}

	state = {
		opened: false
	};

	toggleInserter = ( event ) => {
		event.preventDefault();
		this.setState( {
			opened: ! this.state.opened
		} );
	};

	addBlock = ( id ) => {
		this.props.onAdd( id );
		this.setState( { opened: false } );
	}

	render() {
		return (
			<div className="inserter__button">
				<a href="" onClick={ this.toggleInserter }>
					<AddOutlineIcon />
				</a>
				{ this.state.opened && <Inserter onAdd={ this.addBlock } /> }
			</div>
		);
	}
}
