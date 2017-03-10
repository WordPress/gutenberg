/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { map, debounce } from 'lodash';
import { findDOMNode } from 'react-dom';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import InserterButtonComponent from 'inserter/button';
import stateUpdater from './updater';

class BlockList extends Component {
	state = {
		selected: null,
		focus: { uid: null },
		blocks: [],
	};

	blockNodes = [];
	commands = [];

	componentDidMount() {
		this.setState( { blocks: this.props.content } );
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
	}

	render() {
		const { blocks, focus, selected } = this.state;
		return (
			<div>
				<div className="block-list">
					{ map( blocks, ( block, index ) => {
						const isFocused = block.uid === focus.uid;

						return (
							<BlockListBlock
								ref={ this.bindBlock( block.uid ) }
								key={ block.uid }
								tabIndex={ index }
								isSelected={ selected === block.uid }
								focusConfig={ isFocused ? focus.config : null }
								executeCommand={ ( command ) =>
									this.executeCommand( Object.assign( { uid: block.uid }, command ) )
								}
								block={ block }
								first={ index === 0 }
								last={ index === blocks.length - 1 }
							/>
						);
					} ) }
				</div>
				<InserterButtonComponent onAdd={ this.addBlock } />
			</div>
		);
	}
}

export default BlockList;
