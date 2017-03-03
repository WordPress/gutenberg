/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import EditableFormatToolbar from 'controls/editable-format-toolbar';
import AlignmentToolbar from 'controls/alignment-toolbar';
import BlockArrangement from 'controls/block-arrangement';
import InlineTextBlockForm from '../inline-text-block/form';

export default class ParagraphBlockForm extends Component {
	bindForm = ( ref ) => {
		this.form = ref;
		this.merge = ( ...args ) => this.form.merge( ...args );
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	setAlignment = ( align ) => {
		this.props.change( { align } );
	};

	render() {
		const { block, isFocused } = this.props;
		const selectedTextAlign = block.align || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div>
				{ isFocused && <BlockArrangement block={ block } /> }
				{ isFocused &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<AlignmentToolbar value={ block.align } onChange={ this.setAlignment } />
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.form } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				}

				<div className="paragraph-block__form" style={ style }>
					<InlineTextBlockForm
						ref={ this.bindForm }
						{ ...this.props }
						setToolbarState={ this.setToolbarState }
					/>
				</div>
			</div>
		);
	}
}
