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
		moveUp: () => {},
		moveDown: () => {}
	};

	bindInput = ( ref ) => {
		this.input = ref && ref._rootDOMNode;
	};

	bindMirror = ( ref ) => {
		this.mirror = ref;
	};

	focus = ( position ) => {
		this.input.focus();
		if ( position !== undefined ) {
			this.input.setSelectionRange( position, position );
		}
	}

	componentDidMount() {
		this.render();
	}

	onKeyDown = ( event ) => {
		const { value, splitValue, removePrevious, moveUp, moveDown } = this.props;
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
		} else if ( event.keyCode === 38 && this.input.selectionStart === 0 ) {
			event.preventDefault();
			moveUp();
		} else if ( event.keyCode === 40 && this.input.selectionStart === value.length ) {
			event.preventDefault();
			moveDown();
		}
	};

	render() {
		// Keeping splitValue to exclude it from props
		const ignoredProps = [ 'value', 'splitValue', 'removePrevious', 'moveDown', 'moveUp' ];
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
					onKeyDown={ this.onKeyDown } />
			</div>
		);
	}
}
