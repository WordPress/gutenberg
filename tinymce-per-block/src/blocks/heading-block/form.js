/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import InlineTextBlockForm from '../inline-text-block/form';

export default class HeadingBlockForm extends Component {
	bindForm = ( ref ) => {
		this.form = ref;
		this.focus = ( ...args ) => this.form.focus( ...args );
		this.merge = ( ...args ) => this.form.merge( ...args );
	};

	render() {
		const className = this.props.block.attrs.size ? this.props.block.attrs.size : 'h2';

		return (
			<div className={ `heading-block__form ${ className }` }>
				<InlineTextBlockForm ref={ this.bindForm } { ...this.props } />
			</div>
		);
	}
}
