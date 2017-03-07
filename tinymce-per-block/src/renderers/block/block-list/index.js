/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { assign, map, uniqueId, findIndex } from 'lodash';
import { findDOMNode } from 'react-dom';
import { getBlock } from 'wp-blocks';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';
import InserterButtonComponent from 'inserter/button';

class BlockList extends Component {
	state = {
		selectedUID: null,
		focusedUID: null,
		focusConfig: {},
	};

	blockNodes = [];
	content = [];

	componentDidMount() {
		this.content = this.props.content;
	}

	componentDidUpdate() {
		this.content = this.props.content;
	}

	focus = ( uid, config = {} ) => {
		this.setState( {
			focusedUID: uid,
			focusConfig: config
		} );
	};

	select = ( uid ) => {
		this.setState( {
			selectedUID: uid
		} );
	};

	bindBlock = ( uid ) => ( ref ) => {
		this.blockNodes[ uid ] = ref;
	};

	onChange = ( content ) => {
		this.content = content;
		this.props.onChange( content );
	};

	addBlock = ( id ) => {
		const newBlockUid = uniqueId();
		const blockDefinition = getBlock( id );
		const newBlock = Object.assign( { uid: newBlockUid }, blockDefinition.create() );
		const newBlocks = [
			...this.content,
			newBlock
		];
		this.onChange( newBlocks );
		setTimeout( () => {
			this.focus( newBlockUid );
			this.select( newBlockUid );
		} );
	};

	executeCommand = ( uid, command ) => {
		const { content } = this;
		const index = findIndex( content, b => b.uid === uid );

		// Ignore commands for removed blocks
		if ( index === -1 ) {
			return;
		}

		// Updating blocks
		const commandHandlers = {
			change: ( { changes } ) => {
				const newBlocks = [ ...content ];
				newBlocks[ index ] = assign( {}, content[ index ], changes );
				this.onChange( newBlocks );
				this.select( null );
			},
			append: ( { block: commandBlock } ) => {
				const createdBlock = commandBlock
					? commandBlock
					: { blockType: 'text', content: ' ' };
				const appenedBlockId = uniqueId();
				this.onChange( [
					...content.slice( 0, index + 1 ),
					Object.assign( {}, createdBlock, { uid: appenedBlockId } ),
					...content.slice( index + 1 )
				] );
				setTimeout( () => this.focus( appenedBlockId, { start: true } ) );
				this.select( null );
			},
			remove: ( { uid: commandUID } ) => {
				const uidToRemove = commandUID === undefined ? uid : commandUID;
				const indexToRemove = findIndex( content, b => b.uid === uidToRemove );
				if ( ! commandUID && indexToRemove === 0 ) {
					return;
				}
				this.onChange( [
					...content.slice( 0, indexToRemove ),
					...content.slice( indexToRemove + 1 ),
				] );
				if ( indexToRemove ) {
					const previousBlock = content[ indexToRemove - 1 ];
					setTimeout( () => this.focus( previousBlock.uid, { end: true } ) );
				}
				this.select( null );
			},
			mergeWithPrevious: () => {
				const previousBlock = this.content[ index - 1 ];
				if ( ! previousBlock ) {
					return;
				}
				const previousBlockNode = this.blockNodes[ previousBlock.uid ];
				setTimeout( () => previousBlockNode.merge( content[ index ] ) );
				this.select( null );
			},
			focus: ( { config } ) => {
				this.focus( uid, config );
			},
			moveCursorUp: () => {
				const previousBlock = this.content[ index - 1 ];
				if ( previousBlock ) {
					this.focus( previousBlock.uid, { end: true } );
				}
				this.select( null );
			},
			moveCursorDown: () => {
				const nextBlock = this.content[ index + 1 ];
				if ( nextBlock ) {
					this.focus( nextBlock.uid, { start: true } );
				}
				this.select( null );
			},
			select: () => {
				this.select( uid );
			},
			unselect: () => {
				this.select( null );
			},
			moveBlockUp: () => {
				if ( index === 0 ) {
					return;
				}
				const movedBlockNode = findDOMNode( this.blockNodes[ content[ index ].uid ] );
				const previousOffset = movedBlockNode.getBoundingClientRect().top;
				const newBlocks = [
					...content.slice( 0, index - 1 ),
					content[ index ],
					content[ index - 1 ],
					...content.slice( index + 1 )
				];
				this.onChange( newBlocks );
				// Restaure scrolling after moving the block
				setTimeout( () => {
					const destinationBlock = findDOMNode( this.blockNodes[ content[ index ].uid ] );
					window.scrollTo(
						window.scrollX,
						window.scrollY + destinationBlock.getBoundingClientRect().top - previousOffset
					);
				} );
			},
			moveBlockDown: () => {
				if ( index === content.length - 1 ) {
					return;
				}
				const movedBlockNode = findDOMNode( this.blockNodes[ content[ index ].uid ] );
				const previousOffset = movedBlockNode.getBoundingClientRect().top;
				const newBlocks = [
					...content.slice( 0, index ),
					content[ index + 1 ],
					content[ index ],
					...content.slice( index + 2 )
				];
				this.onChange( newBlocks );
				// Restaure scrolling after moving the block
				setTimeout( () => {
					const destinationBlock = findDOMNode( this.blockNodes[ content[ index ].uid ] );
					window.scrollTo(
						window.scrollX,
						window.scrollY + destinationBlock.getBoundingClientRect().top - previousOffset
					);
				} );
			},
		};

		commandHandlers[ command.type ] && commandHandlers[ command.type ]( command );
	};

	render() {
		const { content } = this.props;
		const { focusedUID, focusConfig, selectedUID } = this.state;
		return (
			<div>
				<div className="block-list">
					{ map( content, ( block, index ) => {
						const isFocused = block.uid === focusedUID;

						return (
							<BlockListBlock
								ref={ this.bindBlock( block.uid ) }
								key={ block.uid }
								tabIndex={ index }
								isSelected={ selectedUID === block.uid }
								focusConfig={ isFocused ? focusConfig : null }
								executeCommand={ ( command ) => this.executeCommand( block.uid, command ) }
								block={ block } />
						);
					} ) }
				</div>
				<InserterButtonComponent onAdd={ this.addBlock } />
			</div>
		);
	}
}

export default BlockList;
