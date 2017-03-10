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
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	setAlignment = ( align ) => {
		this.props.api.change( { align } );
	};

	render() {
		const { api, block, isSelected, focusConfig, first, last } = this.props;
		const selectedTextAlign = block.align || 'left';
		const style = {
			textAlign: selectedTextAlign
		};

		return (
			<div className="text-block__form">
				{ isSelected && <BlockArrangement first={ first } last={ last }
					moveBlockUp={ api.moveBlockUp } moveBlockDown={ api.moveBlockDown } /> }
				{ isSelected &&
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<TransformBlockToolbar blockType="text" onTransform={ api.transform } />
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
					<InserterButton onAdd={ api.replace } />
				}

				<div style={ style } onClick={ api.select }>
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
