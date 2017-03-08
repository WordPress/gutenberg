/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import {
	EditorHeading1Icon,
	EditorHeading2Icon,
	EditorHeading3Icon
} from 'dashicons';

import InlineTextBlockForm from '../inline-text-block/form';
import EditableFormatToolbar from 'controls/editable-format-toolbar';
import BlockArrangement from 'controls/block-arrangement';
import TransformBlockToolbar from 'controls/transform-block-toolbar';

export default class HeadingBlockForm extends Component {
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

	setSize = ( size ) => () => {
		this.props.change( { size } );
	};

	render() {
		const { block, isSelected, moveBlockUp, moveBlockDown, select, transform, first, last } = this.props;
		const sizes = [
			{ id: 'h1', icon: EditorHeading1Icon },
			{ id: 'h2', icon: EditorHeading2Icon },
			{ id: 'h3', icon: EditorHeading3Icon }
		];

		return (
			<div>
				{ isSelected && <BlockArrangement block={ block } first={ first } last={ last }
					moveBlockUp={ moveBlockUp } moveBlockDown={ moveBlockDown } /> }
				{ isSelected && (
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							<TransformBlockToolbar blockType="heading" onTransform={ transform } />
						</div>
						<div className="block-list__block-controls-group">
							{ sizes.map( ( { id, icon: Icon } ) =>
								<button
									key={ id }
									onClick={ this.setSize( id ) }
									className={ classNames( 'block-list__block-control', {
										'is-selected': block.size === id
									} ) }
								>
									<Icon />
								</button>
							) }
						</div>

						<div className="block-list__block-controls-group">
							<EditableFormatToolbar editable={ this.form } ref={ this.bindFormatToolbar } />
						</div>
					</div>
				) }
				<div className={ `heading-block__form ${ block.size }` } onClick={ select }>
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
