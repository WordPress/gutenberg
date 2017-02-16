/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { map } from 'lodash';

/**
 * Internal dependencies
 */
import BlockListBlock from './block';

function BlockList( { nodes, focusIndex, onFocusIndexChange, onChange } ) {
	function onNodeChange( index, nextNode ) {
		const nextNodes = [ ...nodes ];
		nextNodes[ index ] = {
			...nextNodes[ index ],
			...nextNode
		};

		onChange( nextNodes );
	}

	return (
		<div className="block-list">
			{ map( nodes, ( node, index ) => {
				const isFocused = index === focusIndex;

				return (
					<BlockListBlock
						key={ index }
						tabIndex={ index }
						isFocused={ isFocused }
						onFocus={ () => onFocusIndexChange( index ) }
						onFocusOut={ () => onFocusIndexChange( null ) }
						onChange={ ( nextNode ) => onNodeChange( index, nextNode ) }
						node={ node } />
				);
			} ) }
		</div>
	);
}

export default BlockList;
