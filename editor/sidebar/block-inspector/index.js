/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { Provider, Slot } from 'react-slot-fill';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';
import { Panel, PanelHeader, PanelBody } from 'components';
import { getBlockType } from 'blocks';

/**
 * Internal Dependencies
 */
import './style.scss';
import { deselectBlock } from '../../actions';
import { getSelectedBlock } from '../../selectors';

class BlockInspector extends Component {
	constructor() {
		super( ...arguments );

		this.forceUpdateIfSelected = this.forceUpdateIfSelected.bind( this );
	}

	componentWillMount() {
		const { manager: rsfManager } = this.context;
		rsfManager.onComponentsChange( 'Inspector.Controls', this.forceUpdateIfSelected );
	}

	componentWillUnmount() {
		const { manager: rsfManager } = this.context;
		rsfManager.removeOnComponentsChange( 'Inspector.Controls', this.forceUpdateIfSelected );
	}

	forceUpdateIfSelected() {
		// We must bind to the React-Slot-Fill Provider manager to re-render if
		// slots change after the initial render. This can occur when focus
		// changes between blocks, where control fills may only update after
		// change in selected block (and subsequent render) already occurred.
		if ( this.props.selectedBlock ) {
			this.forceUpdate();
		}
	}

	render() {
		const { selectedBlock, ...props } = this.props;
		const { manager: rsfManager } = this.context;
		if ( ! selectedBlock ) {
			return null;
		}

		// Don't show inspector controls if slot is empty
		const hasFills = rsfManager.getFillsByName( 'Inspector.Controls' ).length > 0;
		if ( ! hasFills ) {
			return null;
		}

		const blockType = getBlockType( selectedBlock.name );

		const onDeselect = ( event ) => {
			event.preventDefault();
			props.deselectBlock( selectedBlock.uid );
		};

		const header = (
			<strong>
				<a href="" onClick={ onDeselect } className="editor-block-inspector__deselect-post">
					{ __( 'Post' ) }
				</a>
				{ ' → ' }
				{ blockType.title }
			</strong>
		);

		return (
			<Panel className="editor-block-inspector">
				<PanelHeader label={ header } />
				<PanelBody>
					<Slot name="Inspector.Controls" />
				</PanelBody>
			</Panel>
		);
	}
}

BlockInspector.contextTypes = {
	manager: Provider.childContextTypes.manager,
};

export default connect(
	( state ) => {
		return {
			selectedBlock: getSelectedBlock( state ),
		};
	},
	{ deselectBlock }
)( BlockInspector );
