/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { first, last } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, findDOMNode } from 'element';
import { KeyboardShortcuts } from 'components';

/**
 * Internal dependencies
 */
import './style.scss';
import VisualEditorBlockList from './block-list';
import { getBlockUids } from '../../selectors';
import { clearSelectedBlock, multiSelect } from '../../actions';

class VisualEditor extends Component {
	constructor() {
		super( ...arguments );
		this.bindContainer = this.bindContainer.bind( this );
		this.bindBlocksContainer = this.bindBlocksContainer.bind( this );
		this.onClick = this.onClick.bind( this );
		this.selectAll = this.selectAll.bind( this );
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

	selectAll( event ) {
		const { uids } = this.props;
		event.preventDefault();
		this.props.multiSelect( first( uids ), last( uids ) );
	}

	render() {
		// Disable reason: Clicking the canvas should clear the selection
		/* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/onclick-has-role, jsx-a11y/click-events-have-key-events */
		return (
			<div
				className="editor-visual-editor"
				onMouseDown={ this.onClick }
				onTouchStart={ this.onClick }
				onKeyDown={ this.onKeyDown }
				ref={ this.bindContainer }
			>
				<KeyboardShortcuts shortcuts={ {
					'mod+a': this.selectAll,
				} } />
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
	},
	undefined,
	{
		storeKey: 'editor',
	}
)( VisualEditor );
