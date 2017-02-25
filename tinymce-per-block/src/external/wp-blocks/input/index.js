/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

export default class EnhancedInput extends Component {
	static defaultProps = {
		splitValue: () => {}
	};

	state = {
		height: 'auto'
	};

	bindInput = ( ref ) => {
		this.input = ref;
	};

	focus = ( position ) => {
		this.input.focus();
		this.input.setSelectionRange( position, position );
	}

	autogrow = () => {
		this.setState( { height: this.input.scrollHeight } );
	};

	componentDidMount() {
		this.autogrow();
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.value !== this.props.value ) {
			this.autogrow();
		}
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

		return <textarea
			style={ { height: this.state.height } }
			ref={ this.bindInput }
			{ ...props }
			onInput={ this.autogrow }
			value={ value }
			onKeyDown={ onKeyDown } />;
	}
}
