/**
 * External dependencies
 */
import { createElement } from 'wp-elements';
import { reduce } from 'lodash';
import { EditableComponent } from 'wp-blocks';

import { serialize } from 'serializers/block';

export default function TextBlockForm( block, { setChildren } ) {
	const { children } = block;
	const onChangeContent = ( value ) => {
		setChildren( value );
	};
	const style = reduce( block.attrs, ( memo, value, key ) => {
		switch ( key ) {
			case 'align':
				memo[ 'text-align' ] = value;
				break;
		}

		return memo;
	}, {} );

	return (
		<div classnName="text-block__form" style={ style }>
			<EditableComponent initialContent={ serialize( children ) } onChange={ onChangeContent } />
		</div>
	);
}
