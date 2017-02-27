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
		} else if (
			event.keyCode === 38 || event.keyCode === 40
		) {
			const sanitizeValue = rawValue => {
				return rawValue
					.replace( /&/g, '&amp;' )
					.replace( /"/g, '&quot;' )
					.replace( /'/g, '&#39;' )
					.replace( /</g, '&lt;' )
					.replace( />/g, '&gt;' )
					.replace( /\n/g, '<br />' );
			};

			this.mirror.style.display = 'block';
			this.mirror.innerHTML = '.<br/>.';
			const initialHeight = this.mirror.clientHeight;
			this.mirror.innerHTML =
				sanitizeValue( value.substring( 0, this.input.selectionStart ) ) +
				'.<br/>.';
			const currentHeight = this.mirror.clientHeight;
			this.mirror.innerHTML =
				sanitizeValue( value.substring( 0, this.input.selectionStart ) ) +
				'.' +
				sanitizeValue( value.substring( this.input.selectionStart ) ) +
				'<br/>.';
			const allHeight = this.mirror.clientHeight;
			this.mirror.style.display = 'none';

			const currentRow = currentHeight / ( initialHeight / 2 ) - 1;
			const countRows = allHeight / ( initialHeight / 2 ) - 1;
			if ( currentRow === 1 && event.keyCode === 38 ) {
				event.preventDefault();
				moveUp();
			} else if ( currentRow === countRows && event.keyCode === 40 ) {
				event.preventDefault();
				moveDown();
			}
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
