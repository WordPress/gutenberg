/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { getBlocks } from 'wp-blocks';


export default class InserterComponent extends Component {
	static defaultProps = {
		onAdd: () => {}
	};

	render() {
		const addBlock = ( id ) => () => this.props.onAdd( id );

		return (
			<div className="inserter">
				<div className="inserter__arrow" />
				<div className="inserter__content">
					<div className="inserter__category-blocks">
						{ getBlocks().map( ( { id, title, icon: Icon } ) => (
							<div key={ title } className="inserter__block" onClick={ addBlock( id ) }>
								<Icon />
								{ title }
							</div>
						) ) }
					</div>
				</div>
				<input className="inserter__search" type="search" placeholder="Search..." />
			</div>
		);
	}
}
