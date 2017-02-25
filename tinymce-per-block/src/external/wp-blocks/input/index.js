/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import Textarea from 'react-textarea-autosize';

export default class EnhancedInput extends Component {
	static defaultProps = {
		splitValue: () => {},
		removePrevious: () => {}
	};

	bindInput = ( ref ) => {
		this.input = ref && ref._rootDOMNode;
	};

	focus = ( position ) => {
		this.input.focus();
		if ( position !== undefined ) {
			this.input.setSelectionRange( position, position );
		}
	}

	onKeyDown = ( event ) => {
		const { value, splitValue, removePrevious } = this.props;
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			event.stopPropagation();
			const textBeforeSelection = value.slice( 0, this.input.selectionStart );
			const textAfterSelection = value.slice( this.input.selectionEnd );
			const selection = value.slice( this.selectionStart, this.selectionEnd );
			splitValue( textBeforeSelection, textAfterSelection, selection );
		} else if (
			event.keyCode === 8 &&
			this.input.selectionStart === this.input.selectionEnd &&
			(	this.input.selectionStart === 0 || ( this.input.selectionStart === 1 && value === ' ' ) )
		) {
			removePrevious();
		}
	};

	render() {
		// Keeping splitValue to exclude it from props
		const { value, splitValue, removePrevious, ...props } = this.props;

		return <Textarea
			ref={ this.bindInput }
			{ ...props }
			onInput={ this.autogrow }
			value={ value }
			onKeyDown={ this.onKeyDown } />;
	}
}
