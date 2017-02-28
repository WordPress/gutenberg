/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import { reduce } from 'lodash';

import InlineTextBlockForm from '../inline-text-block/form';

export default class ParagraphBlockForm extends Component {
	bindForm = ( ref ) => {
		this.form = ref;
		this.focus = ( ...args ) => this.form.focus( ...args );
		this.merge = ( ...args ) => this.form.merge( ...args );
	};

	render() {
		const style = reduce( this.props.block.attrs, ( memo, value, key ) => {
			switch ( key ) {
				case 'align':
					memo.textAlign = value;
					break;
			}

			return memo;
		}, {} );

		return (
			<div className="paragraph-block__form" style={ style }>
				<InlineTextBlockForm ref={ this.bindForm } { ...this.props } />
			</div>
		);
	}
}
