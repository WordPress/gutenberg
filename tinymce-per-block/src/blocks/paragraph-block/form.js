/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import { serialize } from 'serializers/block';
import { EnhancedInputComponent } from 'wp-blocks';

export default class ParagraphBlockForm extends Component {
	bindInput = ( ref ) => {
		this.input = ref;
	}

	focus = ( position ) => {
		this.input.focus( position );
	}

	render() {
		const { block, setChildren, appendBlock, executeCommands } = this.props;
		const { children } = block;
		const onChangeContent = ( event ) => {
			executeCommands( setChildren( [ {
				type: 'Text',
				value: event.target.value || ' ' // grammar bug
			} ] ) );
		};
		const splitValue = ( left, right ) => {
			executeCommands( [
				setChildren( [ {
					type: 'Text',
					value: left || ' ' // grammar bug
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

		return (
			<div className="paragraph-block__form">
				<EnhancedInputComponent ref={ this.bindInput } value={ serialize( children ) }
					onChange={ onChangeContent }
					splitValue={ splitValue } />
			</div>
		);
	}
}
