/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import InlineTextBlockForm from '../inline-text-block/form';

export default class QuoteBlockForm extends Component {
	bindForm = ( ref ) => {
		this.form = ref;
		this.focus = ( ...args ) => this.form.focus( ...args );
		this.merge = ( ...args ) => this.form.merge( ...args );
	};

	render() {
		return (
			<div className="quote-block__form">
				<InlineTextBlockForm ref={ this.bindForm } { ...this.props } />
			</div>
		);
	}
}
