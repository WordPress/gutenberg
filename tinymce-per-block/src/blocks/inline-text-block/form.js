/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { EditableComponent } from 'wp-blocks';

export default class InlineTextBlockForm extends Component {
	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	executeCommand = ( ...args ) => {
		this.editable.executeCommand( ...args );
	};

	render() {
		const { api, block, setToolbarState, focusConfig, single = false } = this.props;

		const splitValue = ( left, right ) => {
			api.change( { content: left } );
			if ( right ) {
				api.appendBlock( {
					...block,
					content: right
				} );
			} else {
				api.appendBlock();
			}
		};

		return (
			<EditableComponent
				ref={ this.bindEditable }
				content={ block.content }
				moveCursorUp={ api.moveCursorUp }
				moveCursorDown={ api.moveCursorDown }
				splitValue={ splitValue }
				mergeWithPrevious={ api.mergeWithPrevious }
				remove={ api.remove }
				onChange={ ( value ) => api.change( { content: value } ) }
				setToolbarState={ setToolbarState }
				focusConfig={ focusConfig }
				onFocusChange={ api.focus }
				onType={ api.unselect }
				single={ single }
				inline
			/>
		);
	}
}
