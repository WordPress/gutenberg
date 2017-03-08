/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { EditableComponent } from 'wp-blocks';

export default class InlineTextBlockForm extends Component {
	merge = ( block ) => {
		const acceptedBlockTypes = [ 'quote', 'text', 'heading' ];
		if ( acceptedBlockTypes.indexOf( block.blockType ) === -1 ) {
			return;
		}

		const getLeaves = html => {
			const div = document.createElement( 'div' );
			div.innerHTML = html;
			if ( div.childNodes.length === 1 && div.firstChild.nodeName === 'P' ) {
				return getLeaves( div.firstChild.innerHTML );
			}
			return html;
		};

		const { block: { content }, remove, change, focus } = this.props;
		focus( { end: true } );
		remove( block.uid );
		change( { content: getLeaves( content ) + getLeaves( block.content ) } );
		setTimeout( () => this.editable.updateContent() );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	executeCommand = ( ...args ) => {
		this.editable.executeCommand( ...args );
	};

	render() {
		const { block, change, moveCursorUp, moveCursorDown, appendBlock,
			mergeWithPrevious, remove, setToolbarState, focus, focusConfig, unselect } = this.props;

		const splitValue = ( left, right ) => {
			change( { content: left } );
			setTimeout( () => this.editable.updateContent() );
			if ( right ) {
				appendBlock( {
					...block,
					content: right
				} );
			} else {
				appendBlock();
			}
		};

		return (
			<EditableComponent
				ref={ this.bindEditable }
				content={ block.content }
				moveCursorUp={ moveCursorUp }
				moveCursorDown={ moveCursorDown }
				splitValue={ splitValue }
				mergeWithPrevious={ mergeWithPrevious }
				remove={ remove }
				onChange={ ( value ) => change( { content: value } ) }
				setToolbarState={ setToolbarState }
				focusConfig={ focusConfig }
				onFocusChange={ focus }
				onType={ unselect }
				inline
				single
			/>
		);
	}
}
