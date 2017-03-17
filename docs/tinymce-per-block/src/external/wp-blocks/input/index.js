/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import Textarea from 'react-textarea-autosize';
import { omit } from 'lodash';

export default class EnhancedInput extends Component {
	static defaultProps = {
		splitValue: () => {},
		removePrevious: () => {},
		onChange: () => {},
		onFocusChange: () => {},
		moveCursorUp: () => {},
		moveCursorDown: () => {},
	};

	bindInput = ( ref ) => {
		this.input = ref && ref._rootDOMNode;
	};

	bindMirror = ( ref ) => {
		this.mirror = ref;
	};

	focus() {
		const { start = false } = this.props.focusConfig;
		this.input.focus();
		if (  start ) {
			this.input.setSelectionRange( 0, 0 );
		}
	}

	componentDidMount() {
		if ( this.props.focusConfig ) {
			this.focus();
		}
	}

	componentDidUpdate( prevProps ) {
		if ( this.props.focusConfig !== prevProps.focusConfig && this.props.focusConfig ) {
			this.focus();
		}
	}

	onKeyDown = ( event ) => {
		const { value, splitValue, removePrevious, moveCursorUp, moveCursorDown } = this.props;
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			event.stopPropagation();
			const textBeforeSelection = value.slice( 0, this.input.selectionStart );
			const textAfterSelection = value.slice( this.input.selectionEnd );
			splitValue( textBeforeSelection, textAfterSelection );
		} else if (
			event.keyCode === 8 &&
			this.input.selectionStart === this.input.selectionEnd &&
			(	this.input.selectionStart === 0 || ( this.input.selectionStart === 1 && value === ' ' ) )
		) {
			event.preventDefault();
			removePrevious();
		} else if (
			( event.keyCode === 38 || event.keyCode === 37 ) &&
			this.input.selectionStart === 0
		) {
			event.preventDefault();
			moveCursorUp();
		} else if (
			( event.keyCode === 40 || event.keyCode === 39 ) &&
			this.input.selectionStart === value.length
		) {
			event.preventDefault();
			moveCursorDown();
		}
	};

	onChange = ( event ) => {
		this.props.onChange( event.target.value );
	};

	onFocus = () => {
		this.props.onFocusChange( { position: this.input.selectionStart } );
	};

	render() {
		// Keeping splitValue to exclude it from props
		const ignoredProps = [
			'value', 'splitValue', 'removePrevious', 'moveCursorDown', 'moveCursorUp', 'focusConfig', 'onFocusChange'
		];
		const { value } = this.props;
		const props = omit( this.props, ignoredProps );

		const style = {
			display: 'none',
			wordWrap: 'break-word',
			whiteSpace: 'normal',
		};

		return (
			<div>
				<div
					className="textarea-mirror"
					ref={ this.bindMirror }
					style={ style } />
				<Textarea
					ref={ this.bindInput }
					{ ...props }
					onInput={ this.autogrow }
					value={ value }
					onKeyDown={ this.onKeyDown }
					onChange={ this.onChange }
					onFocus={ this.onFocus }
				/>
			</div>
		);
	}
}
