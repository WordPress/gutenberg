/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component, findDOMNode } from 'element';
import { CHAR_A } from 'utils/keycodes';

/**
 * Internal dependencies
 */
import './style.scss';
import VisualEditorBlockList from './block-list';
import PostTitle from '../../post-title';
import { getBlockUids } from '../../selectors';
import { clearSelectedBlock, multiSelect } from '../../actions';
import { isEditableElement } from '../../utils/dom';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.bindBlocksContainer = this.bindBlocksContainer.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	componentDidMount() {
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	bindContainer( ref ) {
		this.container = ref;
	}

	bindBlocksContainer( ref ) {
		this.blocksContainer = findDOMNode( ref );
	}

	onClick( event ) {
		if ( event.target === this.container || event.target === this.blocksContainer ) {
			this.props.clearSelectedBlock();
		}
	}

	onKeyDown( event ) {
		const { uids } = this.props;
		if (
			! isEditableElement( document.activeElement ) &&
			( event.ctrlKey || event.metaKey ) &&
			event.keyCode === CHAR_A
		) {
			event.preventDefault();
			this.props.multiSelect( first( uids ), last( uids ) );
		}
	}

	render() {
		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				role="region"
				aria-label={ __( 'Visual Editor' ) }
				className="editor-visual-editor"
				onMouseDown={ this.onClick }
				onTouchStart={ this.onClick }
				onKeyDown={ this.onKeyDown }
				ref={ this.bindContainer }
			>
				<PostTitle />
				<VisualEditorBlockList ref={ this.bindBlocksContainer } />
			</div>
		);
		/* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
	}
}

export default connect(
	( state ) => {
		return {
			uids: getBlockUids( state ),
		};
	},
	{
		clearSelectedBlock,
		multiSelect,
	}
)( VisualEditor );
