/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

export default class EnhancedInput extends Component {
	static defaultProps = {
		splitValue: () => {}
	};

	bindInput = ( ref ) => {
		this.input = ref;
	};

	focus = ( position ) => {
		this.input.focus();
		this.input.setSelectionRange( position, position );
	}

	render( { value, splitValue, ...props } ) {
		const onKeyUp = ( event ) => {
			if ( event.keyCode === 13 ) {
				event.preventDefault();
				const textBeforeSelection = value.slice( 0, this.input.selectionStart );
				const textAfterSelection = value.slice( this.input.selectionEnd );
				const selection = value.slice( this.selectionStart, this.selectionEnd );
				splitValue( textBeforeSelection, textAfterSelection, selection );
			}
		};

		return <input ref={ this.bindInput } { ...props } value={ value } onKeyUp={ onKeyUp } />;
	}
}
