/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { serialize } from 'serializers/block';
import { EnhancedInputComponent } from 'wp-blocks';

export default class HeadingBlockForm extends Component {
	bindInput = ( ref ) => {
		this.input = ref;
	}

	focus = ( position ) => {
		this.input.focus( position );
	}

	render( { block, setChildren, appendBlock, executeCommands } ) {
		const { children } = block;
		const onChangeContent = ( event ) => {
			executeCommands( setChildren( [ {
				type: 'Text',
				value: event.target.value
			} ] ) );
		};
		const splitValue = ( left, right ) => {
			executeCommands( [
				setChildren( [ {
					type: 'Text',
					value: left
				} ] ),
				right
					? appendBlock( {
						...block,
						children: [
							{
								type: 'Text',
								value: right
							}
						]
					} )
					: appendBlock()
			] );
		};
		const className = block.attrs.size ? block.attrs.size : 'h2';

		return (
			<div class={ `heading-block__form ${ className }` }>
				<EnhancedInputComponent ref={ this.bindInput } value={ serialize( children ) }
					onChange={ onChangeContent }
					splitValue={ splitValue } />
			</div>
		);
	}
}
