/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { map, debounce } from 'lodash';
import { findDOMNode } from 'react-dom';
import classNames from 'classnames';
import { getBlock } from 'wp-blocks';
import rangy from 'rangy';

/**
 * Internal dependencies
 */
import InserterButtonComponent from 'inserter/button';
import stateUpdater from './updater';
import * as commands from './commands';

class BlockList extends Component {
	state = {
		hovered: null,
		selected: null,
		focus: { uid: null },
		blocks: [],
		contentEditable: false
	};

	blockNodes = {};
	commands = [];
	selections = [];

	bindEditor = ( ref ) => {
		this.editor = ref;
	};

	handleDocumentClick = ( evt ) => {
		const area = findDOMNode( this.editor );
		if ( ! area.contains( evt.target ) ) {
			this.executeCommand( { type: 'unselectAll' } );
		}
	};

	componentDidMount() {
		this.setState( { blocks: this.props.content } );
		window.addEventListener( 'click', this.handleDocumentClick );
		this.editor.addEventListener( 'mousedown', () => {
			this.setState( { contentEditable: true } );
		} );
		this.editor.addEventListener( 'mouseup', () => {
			const range = rangy.getSelection().getRangeAt( 0 );
			let closestContentEditable;
			if ( ! range.commonAncestorContainer.getAttribute ) {
				closestContentEditable = range.commonAncestorContainer.parentNode.closest( '[contentEditable]' );
			}
			else if ( range.commonAncestorContainer.getAttribute( 'contentEditable' ) ) {
				closestContentEditable = range.commonAncestorContainer;
			} else {
				closestContentEditable = range.commonAncestorContainer.closest( '[contentEditable]' );
			}
			const editorNode = findDOMNode( this.editor );
			if ( range.collpased || closestContentEditable !== editorNode ) {
				this.setState( { contentEditable: false } );
			}
		} );
		document.addEventListener( 'selectionchange', () => {
			const range = rangy.getSelection().getRangeAt( 0 );
			if ( range.commonAncestorContainer !== findDOMNode( this.editor ) ) {
				return;
			}
			const blockSelections = [];
			this.state.blocks.forEach( ( { uid } ) => {
				const blockNode = this.blockNodes[ uid ];
				const blockDomNode = findDOMNode( blockNode );
				const selectionNodes = Array.from( blockDomNode.querySelectorAll( '[data-selection]' ) );
				const contained = range.containsNode( blockDomNode );
				const containedPartially = range.containsNode( blockDomNode, true );
				const selections = selectionNodes.map( ( selectionNode ) => {
					const id = selectionNode.getAttribute( 'data-selection' );
					const nodeRange = rangy.createRange();
					nodeRange.selectNodeContents( selectionNode );
					const intersection = nodeRange.intersection( range );
					if ( ! intersection ) {
						return { id, content: false };
					}
					const content = intersection.toHtml();
					return { id, content, node: selectionNode, range: intersection };
				} );
				blockSelections.push( {
					uid,
					contained,
					containedPartially,
					selections
				} );
			} );
			this.selections = blockSelections;
		} );
	}

	componentWillUnmount() {
		window.removeEventListener( 'click', this.handleDocumentClick );
	}

	componentDidUpdate() {
		if ( this.props.content !== this.state.blocks ) {
			this.setState( { blocks: this.props.content } );
		}
	}

	bindBlock = ( uid ) => ( ref ) => {
		this.blockNodes[ uid ] = ref;
	};

	executeCommand = ( command ) => {
		this.commands.push( command );
		this.runBatchedCommands();
	};

	runBatchedCommands = debounce( () => {
		if ( ! this.commands.length ) {
			return;
		}

		const previousState = this.state;
		const newState = this.commands.reduce( ( memo, command ) => {
			return stateUpdater( memo, command );
		}, previousState );

		// Middlewares ( Handling scroll position when moving blocks )
		let previousOffset;
		const moveCommand = this.commands.reverse()
			.find( command => [ 'moveBlockDown', 'moveBlockUp' ].indexOf( command.type ) !== -1 );
		const shouldUpdateScroll = !! moveCommand;
		if ( shouldUpdateScroll ) {
			const movedBlockNode = findDOMNode( this.blockNodes[ moveCommand.uid ] );
			previousOffset = movedBlockNode.getBoundingClientRect().top;
		}

		this.setState( newState );

		if ( shouldUpdateScroll ) {
			// Restaure scrolling after moving the block
			setTimeout( () => {
				const destinationBlock = findDOMNode( this.blockNodes[ moveCommand.uid ] );
				window.scrollTo(
					window.scrollX,
					window.scrollY + destinationBlock.getBoundingClientRect().top - previousOffset
				);
			} );
		}

		this.props.onChange( newState.blocks );
		this.commands = [];
	} );

	addBlock = ( id ) => {
		this.executeCommand( { type: 'addBlock', id } );
	};

	onKeyDown = ( event ) => {
		if ( ! this.state.contentEditable ) {
			return;
		}
		event.preventDefault();
		event.stopPropagation();
		const containedElements = this.selections.filter( selection => selection.contained );
		const containedPartially = this.selections.filter( selection => selection.containedPartially );
		containedElements.forEach( ( { uid } ) => {
			const command = commands.remove();
			command.uid = uid;
			this.executeCommand( command );
		} );
		containedPartially.forEach( ( { uid, selections } ) => {
			const changes = selections.reduce(
				( memo, selection ) => {
					if ( ! selection.content ) {
						return memo;
					}
					selection.range.deleteContents();
					memo[ selection.id ] = selection.node.innerHTML;
					return memo;
				},
				{}
			);
			const command = commands.change( changes );
			command.uid = uid;
			this.executeCommand( command );
		} );
		if ( containedPartially.length === 2 ) {
			const mergedBlock = containedPartially[ 1 ].uid;
			const command = commands.mergeWithPrevious();
			command.uid = mergedBlock;
			this.executeCommand( command );
		}

		setTimeout( () => {
			this.setState( { contentEditable: false } );
		} );
	};

	render() {
		const { blocks, focus, selected, hovered, contentEditable } = this.state;

		return (
			<div>
				<div className="block-list" ref={ this.bindEditor } contentEditable={ contentEditable } suppressContentEditableWarning onKeyDown={ this.onKeyDown }>
					{ map( blocks, ( block, index ) => {
						const isFocused = block.uid === focus.uid;
						const api = Object.keys( commands ).reduce( ( memo, command ) => {
							memo[ command ] = ( ...args ) => {
								const commandObject = Object.assign(
									{ uid: block.uid },
									commands[ command ]( ...args )
								);
								this.executeCommand( commandObject );
							};
							return memo;
						}, {} );
						const classes = classNames( 'block-list__block', {
							'is-selected': selected === block.uid
						} );
						const blockDefinition = getBlock( block.blockType );
						if ( ! blockDefinition ) {
							return null;
						}
						const Form = blockDefinition.form;

						return (
							<div
								key={ block.uid }
								tabIndex={ index }
								className={ classes }
								ref={ this.bindBlock( block.uid ) }
							>
								<Form
									block={ block }
									api={ api }
									isSelected={ selected === block.uid }
									isHovered={ hovered === block.uid }
									focusConfig={ isFocused ? focus.config : null }
									first={ index === 0 }
									last={ index === blocks.length - 1 }
								/>
							</div>
						);
					} ) }
				</div>
				<InserterButtonComponent onAdd={ this.addBlock } />
			</div>
		);
	}
}

export default BlockList;
