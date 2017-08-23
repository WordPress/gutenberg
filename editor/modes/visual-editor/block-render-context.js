/**
 * WordPress dependencies
 */
import { buildVTree, renderSubtreeIntoContainer, Component } from '@wordpress/element';

class BlockRenderContext extends Component {
	componentDidMount() {
		this.delegatedRender();
	}

	componentDidUpdate() {
		this.delegatedRender();
	}

	delegatedRender() {
		const { render, ...props } = this.props;
		const result = render( { ...props, target: this.node } );

		if ( result ) {
			renderSubtreeIntoContainer(
				this,
				buildVTree( result ),
				this.node
			);
		}
	}

	render() {
		return <div ref={ ( node ) => this.node = node } />;
	}
}

export default BlockRenderContext;
