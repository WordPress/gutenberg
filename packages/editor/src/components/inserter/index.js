/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';

const defaultRenderToggle = ( { onToggle, disabled, isOpen } ) => (
	<IconButton
		icon="insert"
		label={ __( 'Add block' ) }
		labelPosition="bottom"
		onClick={ onToggle }
		className="editor-inserter__toggle"
		aria-haspopup="true"
		aria-expanded={ isOpen }
		disabled={ disabled }
	/>
);

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
		this.renderToggle = this.renderToggle.bind( this );
		this.renderContent = this.renderContent.bind( this );
	}

	onToggle( isOpen ) {
		const { onToggle } = this.props;

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	/**
	 * Render callback to display Dropdown toggle element.
	 *
	 * @param {Function} options.onToggle Callback to invoke when toggle is
	 *                                    pressed.
	 * @param {boolean}  options.isOpen   Whether dropdown is currently open.
	 *
	 * @return {WPElement} Dropdown toggle element.
	 */
	renderToggle( { onToggle, isOpen } ) {
		const {
			disabled,
			renderToggle = defaultRenderToggle,
		} = this.props;

		return renderToggle( { onToggle, isOpen, disabled } );
	}

	/**
	 * Render callback to display Dropdown content element.
	 *
	 * @param {Function} options.onClose Callback to invoke when dropdown is
	 *                                   closed.
	 *
	 * @return {WPElement} Dropdown content element.
	 */
	renderContent( { onClose } ) {
		const { rootClientId, index } = this.props;

		return (
			<InserterMenu
				onSelect={ onClose }
				rootClientId={ rootClientId }
				index={ index }
			/>
		);
	}

	render() {
		const { position, title } = this.props;

		return (
			<Dropdown
				className="editor-inserter"
				contentClassName="editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ title }
				renderToggle={ this.renderToggle }
				renderContent={ this.renderContent }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId, index } ) => {
		const {
			getEditedPostAttribute,
			getBlockInsertionPoint,
			hasInserterItems,
		} = select( 'core/editor' );

		if ( rootClientId === undefined && index === undefined ) {
			// Unless explicitly provided, the default insertion point provided
			// by the store occurs immediately following the selected block.
			// Otherwise, the default behavior for an undefined index is to
			// append block to the end of the rootClientId context.
			const insertionPoint = getBlockInsertionPoint();
			( { rootClientId, index } = insertionPoint );
		}

		return {
			title: getEditedPostAttribute( 'title' ),
			hasItems: hasInserterItems( rootClientId ),
			rootClientId,
			index,
		};
	} ),
	ifCondition( ( { hasItems } ) => hasItems ),
] )( Inserter );
