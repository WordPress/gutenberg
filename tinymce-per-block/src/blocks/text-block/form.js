/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';

import EditableFormatToolbar from 'controls/editable-format-toolbar';
import AlignmentToolbar from 'controls/alignment-toolbar';
import BlockArrangement from 'controls/block-arrangement';
import TransformBlockToolbar from 'controls/transform-block-toolbar';
import InlineTextBlockForm from 'blocks/inline-text-block/form';
import InserterButton from 'inserter/button';

export default class TextBlockForm extends Component {
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
		const { block, isSelected, focusConfig, moveBlockUp, moveBlockDown,
			replace, select, transform, first, last } = this.props;
		const selectedTextAlign = block.align || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div className="text-block__form">
				{ isSelected && <BlockArrangement block={ block } first={ first } last={ last }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<TransformBlockToolbar blockType="text" onTransform={ transform } />
						</div>

						<div className="block-list__block-controls-group">
							<AlignmentToolbar value={ block.align } onChange={ this.setAlignment } />
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.form } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				}

				{ ! block.content.trim() && ! isSelected && focusConfig &&
					<InserterButton onAdd={ ( id ) => replace( id ) } />
				}

				<div style={ style } onClick={ select }>
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
