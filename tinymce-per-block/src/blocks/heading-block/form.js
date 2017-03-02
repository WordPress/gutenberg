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
		this.props.setAttributes( { size } );
	};

	render() {
		const { block, isFocused } = this.props;
		const className = block.attrs.size ? block.attrs.size : 'h2';
		const sizes = [
			{ id: 'h1', icon: EditorHeading1Icon },
			{ id: 'h2', icon: EditorHeading2Icon },
			{ id: 'h3', icon: EditorHeading3Icon }
		];

		return (
			<div>
				{ isFocused && (
					<div className="block-list__block-controls">
						<div className="block-list__block-controls-group">
							{ sizes.map( ( { id, icon: Icon } ) =>
								<button
									key={ id }
									onClick={ this.setSize( id ) }
									className={ classNames( 'block-list__block-control', {
										'is-selected': className === id
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
				<div className={ `heading-block__form ${ className }` }>
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
