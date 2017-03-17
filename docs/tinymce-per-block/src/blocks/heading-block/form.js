/**
 * External dependencies
 */
import { createElement, Component } from 'wp-elements';
import classNames from 'classnames';
import { EditorHeadingIcon } from 'dashicons';

/**
 * Internal dependencies
 */
import { EditableComponent } from 'wp-blocks';
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
		const { api, block, isSelected, isHovered, first, last, focusConfig } = this.props;
		const sizes = [ 'h1', 'h2', 'h3' ];
		const splitValue = ( left, right ) => {
			api.change( { content: left } );
			if ( right ) {
				api.appendBlock( {
					...block,
					content: right
				} );
			} else {
				api.appendBlock();
			}
		};

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
					<EditableComponent
						ref={ this.bindForm }
						content={ block.content }
						moveCursorUp={ api.moveCursorUp }
						moveCursorDown={ api.moveCursorDown }
						splitValue={ splitValue }
						mergeWithPrevious={ api.mergeWithPrevious }
						remove={ api.remove }
						onChange={ ( value ) => api.change( { content: value } ) }
						setToolbarState={ this.setToolbarState }
						focusConfig={ focusConfig }
						onFocusChange={ api.focus }
						onType={ api.unselect }
						single
						inline
					/>
				</div>
			</div>
		);
	}
}
