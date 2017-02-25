/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { reduce } from 'lodash';
import { EditableComponent } from 'wp-blocks';

import { serialize } from 'serializers/block';

export default function TextBlockForm( { block, setChildren, executeCommands } ) {
	const { children } = block;
	const style = reduce( block.attrs, ( memo, value, key ) => {
		switch ( key ) {
			case 'align':
				memo.textAlign = value;
				break;
		}

		return memo;
	}, {} );

	return (
		<div className="text-block__form" style={ style }>
			<EditableComponent initialContent={ serialize( children ) }
				onChange={ ( value ) => executeCommands( setChildren( value ) ) } />
		</div>
	);
}
