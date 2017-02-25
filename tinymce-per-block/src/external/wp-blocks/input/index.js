/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import Textarea from 'react-textarea-autosize';

export default class EnhancedInput extends Component {
	static defaultProps = {
		splitValue: () => {}
	};

	bindInput = ( ref ) => {
		this.input = ref && ref._rootDOMNode;
	};

	focus = ( position ) => {
		this.input.focus();
		this.input.setSelectionRange( position, position );
	}

	render() {
		const { value, splitValue, ...props } = this.props;
		const onKeyDown = ( event ) => {
			if ( event.keyCode === 13 ) {
				event.preventDefault();
				event.stopPropagation();
				const textBeforeSelection = value.slice( 0, this.input.selectionStart );
				const textAfterSelection = value.slice( this.input.selectionEnd );
				const selection = value.slice( this.selectionStart, this.selectionEnd );
				splitValue( textBeforeSelection, textAfterSelection, selection );
			}
		};

		return <Textarea
			ref={ this.bindInput }
			{ ...props }
			onInput={ this.autogrow }
			value={ value }
			onKeyDown={ onKeyDown } />;
	}
}
