/**
 * WordPress dependencies
 */
import { Component } from 'element';

export default class AncestorSize extends Component {
	constructor() {
		super( ...arguments );

		this.getAncestorSize = this.getAncestorSize.bind( this );
		this.bindContainer = this.bindContainer.bind( this );
	}
	bindContainer( ref ) {
		this.containerRef = ref;
	}
	getAncestorSize() {
		if ( this.containerRef ) {
			const ancestor = this.containerRef.closest( this.props.ancestorSelector );

			if ( ancestor ) {
				const { width, height } = ancestor.getBoundingClientRect();
				return { width, height };
			}

			return { width: 0, height: 0 };
		}

		return { width: 0, height: 0 };
	}
	render() {
		return (
			<div ref={ this.bindContainer } >
				{ this.props.children( this.getAncestorSize ) }
			</div>
		);
	}
}
