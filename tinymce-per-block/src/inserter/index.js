/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { getBlocks } from 'wp-blocks';


export default class InserterComponent extends Component {
	static defaultProps = {
		onAdd: () => {}
	};

	state = {
		filterValue: ''
	};

	filter = ( event ) => {
		this.setState( {
			filterValue: event.target.value
		} );
	};

	render() {
		const addBlock = ( id ) => () => this.props.onAdd( id );
		const stopPropagation = ( event ) => event.stopPropagation();
		const blocks = getBlocks().filter(
			( block ) => block.title.toLowerCase().indexOf( this.state.filterValue.toLowerCase() ) !== -1
		);

		return (
			<div className="inserter" onClick={ stopPropagation }>
				<div className="inserter__arrow" />
				<div className="inserter__content">
					<div className="inserter__category-blocks">
						{ blocks.map( ( { id, title, icon: Icon } ) => (
							<div key={ title } className="inserter__block" onClick={ addBlock( id ) }>
								<Icon />
								{ title }
							</div>
						) ) }
					</div>
				</div>
				<input className="inserter__search" type="search" placeholder="Search..." onChange={ this.filter } />
			</div>
		);
	}
}
