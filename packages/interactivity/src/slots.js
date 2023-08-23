/**
 * External dependencies
 */
import { Component } from 'preact';

export class SlotContent {
	apply( slot, content, fireChange ) {
		const { named, onChange } = this.context;
		if ( named ) {
			named[ slot ] = content;
			if ( fireChange ) {
				for ( let i = 0; i < onChange.length; i++ ) {
					onChange[ i ]();
				}
			}
		}
	}

	componentWillMount() {
		this.apply( this.props.slot, this.props.children, true );
	}

	componentWillReceiveProps( { slot, children } ) {
		if ( slot !== this.props.slot ) {
			this.apply( this.props.slot, null, false );
			this.apply( slot, children, true );
		} else if ( children !== this.props.children ) {
			this.apply( slot, children, true );
		}
	}

	componentWillUnmount() {
		this.apply( this.props.slot, null, true );
	}

	render( props ) {
		return props.slot ? null : props.children;
	}
}

export class SlotProvider {
	getChildContext() {
		return { named: {}, onChange: [] };
	}

	render( props ) {
		return props.children;
	}
}

export class Slot extends Component {
	state = {};

	constructor( props, context ) {
		super( props, context );
		this.__update();
	}

	componentDidMount() {
		this.context.onChange.push( this.__update.bind( this ) );
	}

	componentWillUnmount() {
		this.context.onChange.push( this.__update.bind( this ) );
	}

	render( props, state ) {
		const child = props.children;
		return typeof child === 'function'
			? child( state.content )
			: state.content || child;
	}

	__update() {
		const content = this.context.named[ this.props.name ];
		if ( content !== this.state.content ) {
			this.setState( { content } );
		}
	}
}
