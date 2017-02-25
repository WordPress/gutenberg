/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { assign, map } from 'lodash';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';

class BlockList extends Component {
	state = {
		focusIndex: null,
	};

	blockNodes = [];
	content = [];

	componentDidMount() {
		this.content = this.props.content;
	}

	componentDidUpdate() {
		this.content = this.props.content;
	}

	onFocusIndexChange = ( index ) => {
		this.setState( { focusIndex: index } );
	};

	bindBlock = ( index ) => ( ref ) => {
		this.blockNodes[ index ] = ref;
	};

	focusBlock = ( index, position ) => {
		this.blockNodes[ index ].focus( position );
	};

	onChange = ( content ) => {
		this.props.onChange( content );
		this.content = content;
	}

	executeCommand = ( index, command ) => {
		const { content } = this;
		// Updating blocks
		switch ( command.type ) {
			case 'change':
				const newNodes = [ ...content ];
				newNodes[ index ] = assign( {}, content[ index ], command.changes );
				this.onChange( newNodes );
				return;
			case 'append':
				const block = command.block
					? command.block
					: {
						type: 'WP_Block',
						blockType: 'paragraph',
						attrs: {},
						startText: '<!-- wp:paragraph -->',
						endText: '<!-- /wp -->',
						rawContent: '<!-- wp:paragraph --><!-- /wp -->',
						children: [
							{
								type: 'Text',
								value: ' '
							}
						]
					};
				this.onChange( [
					...content.slice( 0, index + 1 ),
					block,
					...content.slice( index + 1 )
				] );
				setTimeout( () => this.focusBlock( index + 1, 0 ) );
				return;
			case 'remove':
				const indexToRemove = command.index === undefined ? index : command.index;
				if ( indexToRemove === 0 && index === 0 ) {
					return;
				}
				this.onChange( [
					...content.slice( 0, indexToRemove ),
					...content.slice( indexToRemove + 1 ),
				] );
				setTimeout( () => this.focusBlock( indexToRemove - 1 ) );
				return;
			case 'mergeWithPrevious':
				const previousBlockNode = this.blockNodes[ index - 1 ];
				if ( ! previousBlockNode ) {
					return;
				}
				setTimeout( () => previousBlockNode.merge( content[ index ], index ) );
				return;
			case 'focus':
				this.focusBlock( index, command.position );
				return;
		}
	};

	render() {
		const { content } = this.props;
		const { focusIndex } = this.state;
		return (
			<div className="block-list">
				{ map( content, ( node, index ) => {
					const isFocused = index === focusIndex;

					return (
						<BlockListBlock
							ref={ this.bindBlock( index ) }
							key={ index }
							tabIndex={ index }
							isFocused={ isFocused }
							onFocus={ () => this.onFocusIndexChange( index ) }
							onBlur={ () => this.onFocusIndexChange( null ) }
							executeCommand={ ( command ) => this.executeCommand( index, command ) }
							node={ node } />
					);
				} ) }
			</div>
		);
	}
}

export default BlockList;
