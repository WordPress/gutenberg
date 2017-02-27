/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { reduce } from 'lodash';
import { EditableComponent } from 'wp-blocks';

import { serialize } from 'serializers/block';

export default class TextBlockForm extends Component {
	focus( position ) {
		this.editable.focus( position );
	}

	bindEditable = ( ref ) => {
		this.editable = ref;
	}

	render() {
		const { block, setChildren, moveUp, moveDown } = this.props;
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
				<EditableComponent
					ref={ this.bindEditable }
					initialContent={ serialize( children ) }
					moveUp={ moveUp }
					moveDown={ moveDown }
					onChange={ ( value ) => setChildren( value ) } />
			</div>
		);
	}
}
