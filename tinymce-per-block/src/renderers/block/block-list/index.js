/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';

class BlockList extends Component {
	state = {
		focusIndex: null
	};

	onFocusIndexChange = ( index ) => {
		this.setState( { focusIndex: index } );
	}

	render( { content, onChange }, { focusIndex } ) {
		function onNodeChange( index, nextNode ) {
			const nextNodes = [ ...content ];
			nextNodes[ index ] = {
				...nextNodes[ index ],
				...nextNode
			};

			onChange( nextNodes );
		}

		return (
			<div className="block-list">
				{ map( content, ( node, index ) => {
					const isFocused = index === focusIndex;

					return (
						<BlockListBlock
							key={ index }
							tabIndex={ index }
							isFocused={ isFocused }
							onFocus={ () => this.onFocusIndexChange( index ) }
							onFocusOut={ () => this.onFocusIndexChange( null ) }
							onChange={ ( nextNode ) => onNodeChange( index, nextNode ) }
							node={ node } />
					);
				} ) }
			</div>
		);
	}
}

export default BlockList;
