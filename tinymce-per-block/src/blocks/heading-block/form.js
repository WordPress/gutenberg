/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { EditorHeadingIcon } from 'dashicons';

import InlineTextBlockForm from '../inline-text-block/form';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';
import TransformBlockToolbar from 'controls/transform-block-toolbar';

export default class HeadingBlockForm extends Component {
	bindForm = ( ref ) => {
		this.form = ref;
	};

	bindFormatToolbar = ( ref ) => {
		this.toolbar = ref;
	};

	setToolbarState = ( ...args ) => {
		this.toolbar && this.toolbar.setToolbarState( ...args );
	};

	setSize = ( size ) => () => {
		this.props.api.change( { size } );
	};

	render() {
		const { api, block, isSelected, isHovered, first, last } = this.props;
		const sizes = [ 'h1', 'h2', 'h3' ];

		return (
			<div onMouseEnter={ api.hover } onMouseLeave={ api.unhover }>
				{ ( isSelected || isHovered ) && <BlockArrangement first={ first } last={ last }
					moveBlockUp={ api.moveBlockUp } moveBlockDown={ api.moveBlockDown } /> }
				{ isSelected && (
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<TransformBlockToolbar blockType="heading" onTransform={ api.transform } />
						</div>

						<div className="block-list__block-controls-group">
							{ sizes.map( ( size, index ) =>
								<button
									key={ size }
									onClick={ this.setSize( size ) }
									className={ classNames(
										'block-list__block-control',
										'heading-block__toolbar-size-button',
										{ 'is-selected': block.size === size }
									) }
								>
									<EditorHeadingIcon />
									<span className="heading-block__toolbar-size">{ index }</span>
								</button>
							) }
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.form } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				) }
				<div className={ `heading-block__form ${ block.size }` } onClick={ api.select }>
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
