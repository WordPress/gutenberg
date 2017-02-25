/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { assign, map, compact } from 'lodash';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';

class BlockList extends Component {
	state = {
		focusIndex: null
	};

	blocks = [];

	onFocusIndexChange = ( index ) => {
		this.setState( { focusIndex: index } );
	};

	bindBlock = ( index ) => ( ref ) => {
		this.blocks[ index ] = ref;
	};

	focusBlock = ( index ) => {
		this.blocks[ index ].focus( 0 );
	};

	executeCommands = ( index, commands = [] ) => {
		const { content, onChange } = this.props;
		const nonEmptyCommands = compact( commands );
		if ( ! nonEmptyCommands.length ) {
			return;
		}
		const focus = nonEmptyCommands.find( command => command.type === 'append' ) ? index + 1 : false;
		const nextNodes = nonEmptyCommands.reduce( ( memo, command ) => {
			switch ( command.type ) {
				case 'change':
					memo[ index ] = assign( {}, memo[ index ], command.changes );
					return memo;
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
					return [
						...memo.slice( 0, index + 1 ),
						block,
						...memo.slice( index + 1 )
					];
			}
		}, [ ...content ] );

		onChange( nextNodes );
		if ( focus !== false ) {
			setTimeout( () => this.focusBlock( focus ) );
		}
	};

	render() {
		const { content } = this.props;
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
							executeCommands={ ( commands ) => this.executeCommands( index, commands ) }
							node={ node } />
					);
				} ) }
			</div>
		);
	}
}

export default BlockList;
