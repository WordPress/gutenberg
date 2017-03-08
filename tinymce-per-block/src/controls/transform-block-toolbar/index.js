/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { getBlock, getBlocks } from 'wp-blocks';
import { reduce } from 'lodash';

export default class TransformBlockToolbar extends Component {
	state = {
		open: false
	};

	toggleMenu = () => {
		this.setState( {
			open: ! this.state.open
		} );
	};

	render() {
		const blockDefinition = getBlock( this.props.blockType );
		const allowedBlocks = reduce( getBlocks(), ( memo, block ) => {
			const transformation = block.transformations &&
				block.transformations.find( t => t.blocks.indexOf( this.props.blockType ) !== -1 );
			return transformation ? memo.concat( [ block ] ) : memo;
		}, [] );
		if ( ! allowedBlocks.length ) {
			return null;
		}
		const BlockIcon = blockDefinition.icon;

		return (
			<div className="transform-block-toolbar block-list__block-toolbar">
				<button className="block-list__block-control" onClick={ this.toggleMenu }>
					<BlockIcon />
					<div className="transform-block-toolbar__arrow" />
				</button>
				{ this.state.open &&
					<div className="transform-block-toolbar__menu">
						{ allowedBlocks.map( ( { id, title, icon: Icon } ) => (
							<div
								key={ id }
								onClick={ () => this.props.onTransform( id ) }
								className="transform-block-toolbar__menu-item"
							>
								<Icon /> { title }
							</div>
						) ) }
					</div>
				}
			</div>
		);
	}
}
