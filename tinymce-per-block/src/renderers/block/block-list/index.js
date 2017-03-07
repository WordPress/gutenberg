/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { assign, map, uniqueId } from 'lodash';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';

class BlockList extends Component {
	state = {
		focusIndex: null,
		focusConfig: {},
		selectedIndex: null,
	};

	blockNodes = [];
	content = [];

	componentDidMount() {
		this.content = this.props.content;
	}

	componentDidUpdate() {
		this.content = this.props.content;
	}

	focus = ( index, config = {} ) => {
		this.setState( {
			focusIndex: index,
			focusConfig: config
		} );
	};

	select = ( index ) => {
		this.setState( {
			selectedIndex: index
		} );
	}

	bindBlock = ( index ) => ( ref ) => {
		this.blockNodes[ index ] = ref;
	};

	onChange = ( content ) => {
		this.content = content;
		this.props.onChange( content );
	}

	executeCommand = ( index, block, command ) => {
		const { content } = this;

		// Ignore commands for removed blocks
		if ( ! content.find( b => b.uid === block.uid ) ) {
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
				this.onChange( [
					...content.slice( 0, index + 1 ),
					Object.assign( {}, createdBlock, { uid: uniqueId() } ),
					...content.slice( index + 1 )
				] );
				setTimeout( () => this.focus( index + 1, { start: true } ) );
				this.select( null );
			},
			remove: ( { index: commandIndex } ) => {
				const indexToRemove = commandIndex === undefined ? index : commandIndex;
				if ( indexToRemove === 0 && index === 0 ) {
					return;
				}
				this.onChange( [
					...content.slice( 0, indexToRemove ),
					...content.slice( indexToRemove + 1 ),
				] );
				setTimeout( () => this.focus( indexToRemove - 1, { end: true } ) );
				this.select( null );
			},
			mergeWithPrevious: () => {
				const previousBlockNode = this.blockNodes[ index - 1 ];
				if ( ! previousBlockNode ) {
					return;
				}
				setTimeout( () => previousBlockNode.merge( content[ index ], index ) );
				this.select( null );
			},
			focus: ( { config } ) => {
				this.focus( index, config );
			},
			moveUp: () => {
				const previousBlockNode = this.blockNodes[ index - 1 ];
				if ( previousBlockNode ) {
					this.focus( index - 1, { end: true } );
				}
				this.select( null );
			},
			moveDown: () => {
				const nextBlockNode = this.blockNodes[ index + 1 ];
				if ( nextBlockNode ) {
					this.focus( index + 1, { start: true } );
				}
				this.select( null );
			},
			select: () => {
				this.select( index );
			},
			unselect: () => {
				this.select( null );
			}
		};

		commandHandlers[ command.type ] && commandHandlers[ command.type ]( command );
	};

	render() {
		const { content } = this.props;
		const { focusIndex, focusConfig,  selectedIndex } = this.state;
		return (
			<div className="block-list">
				{ map( content, ( block, index ) => {
					const isFocused = index === focusIndex;

					return (
						<BlockListBlock
							ref={ this.bindBlock( index ) }
							key={ block.uid }
							tabIndex={ index }
							isSelected={ selectedIndex === index }
							focusConfig={ isFocused ? focusConfig : null }
							executeCommand={ ( command ) => this.executeCommand( index, block, command ) }
							block={ block } />
					);
				} ) }
			</div>
		);
	}
}

export default BlockList;
