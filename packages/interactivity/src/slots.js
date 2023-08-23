/**
 * External dependencies
 */
import { Component } from 'preact';

export class SlotContent {
	apply( slot, content, fireChange ) {
		const { slots } = this.context;
		if ( slot ) {
			slots.named[ slot ] = content;
			if ( fireChange ) {
				for ( let i = 0; i < slots.onChange.length; i++ ) {
					slots.onChange[ i ]();
				}
			}
		}
	}

	componentWillMount() {
		this.apply( this.props.slot, this.props.children[ 0 ], true );
	}

	componentWillReceiveProps( { slot, children } ) {
		if ( slot !== this.props.slot ) {
			this.apply( this.props.slot, null, false );
			this.apply( slot, children[ 0 ], true );
		} else if ( children[ 0 ] !== this.props.children[ 0 ] ) {
			this.apply( slot, children[ 0 ], true );
		}
	}

	componentWillUnmount() {
		this.apply( this.props.slot, null, true );
	}

	render( props ) {
		return props.slot ? null : props.children[ 0 ];
	}
}

export class SlotProvider {
	getChildContext() {
		return {
			slots: {
				named: {},
				onChange: [],
			},
		};
	}

	render( props ) {
		return props.children[ 0 ];
	}
}

export class Slot extends Component {
	state = {};

	constructor( props, context ) {
		super( props, context );
		this.__update();
	}

	componentDidMount() {
		this.context.slots.onChange.push( this.__update.bind( this ) );
	}

	componentWillUnmount() {
		this.context.slots.onChange.push( this.__update.bind( this ) );
	}

	render( props, state ) {
		const child = props.children && props.children[ 0 ];
		return typeof child === 'function'
			? child( state.content )
			: state.content || child;
	}

	__update() {
		const content = this.context.slots.named[ this.props.name ];
		if ( content !== this.state.content ) {
			this.setState( { content } );
		}
	}
}
