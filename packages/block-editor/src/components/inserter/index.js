/**
 * External dependencies
 */
import classnames from 'classnames';
import {
	get,
} from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton, Button, Icon } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { withDispatch, withSelect } from '@wordpress/data';
import { compose, ifCondition } from '@wordpress/compose';
import {
	createBlock,
} from '@wordpress/blocks';

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
		className="editor-inserter__toggle block-editor-inserter__toggle"
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
	 * @param {Object}   options
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
	 * @param {Object}   options
	 * @param {Function} options.onClose Callback to invoke when dropdown is
	 *                                   closed.
	 *
	 * @return {WPElement} Dropdown content element.
	 */
	renderContent( { onClose } ) {
		const { rootClientId, clientId, isAppender, showInserterHelpPanel } = this.props;

		return (
			<InserterMenu
				onSelect={ onClose }
				rootClientId={ rootClientId }
				clientId={ clientId }
				isAppender={ isAppender }
				showInserterHelpPanel={ showInserterHelpPanel }
			/>
		);
	}

	render() {
		const { position, hasOneAllowedItem, createIfOne } = this.props;
		let toggle = null;
		if ( hasOneAllowedItem ) {
			toggle = () => {
				return (
					<Button
						className={ classnames( 'block-editor-button-block-appender' ) }
						onClick={ createIfOne }
					>
						<span className="screen-reader-text">{ __( 'Add Block' ) }</span>
						<Icon icon="insert" />
					</Button>
				);
			};
		} else {
			toggle = this.renderToggle;
		}

		return (
			<Dropdown
				className="editor-inserter block-editor-inserter"
				contentClassName="editor-inserter__popover block-editor-inserter__popover"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				headerTitle={ __( 'Add a block' ) }
				renderToggle={ toggle }
				renderContent={ this.renderContent }
			/>
		);
	}
}

export default compose( [
	withSelect( ( select, { rootClientId } ) => {
		const { hasInserterItems, hasOneAllowedItem } = select( 'core/block-editor' );

		return {
			hasItems: hasInserterItems( rootClientId ),
			hasOneAllowedItem: hasOneAllowedItem( rootClientId ),
		};
	} ),
	withDispatch( ( dispatch, ownProps, { select } ) => {
		// eslint-disable-next-line no-restricted-syntax
		function createIfOne() {
			const { rootClientId, clientId, destinationRootClientId, isAppender } = ownProps;
			const {
				getBlockListSettings,
			} = select( 'core/block-editor' );
			const parentBlockListSettings = getBlockListSettings( rootClientId );
			const isOnlyOneAllowedBlock = get( parentBlockListSettings, [ 'allowedBlocks', 'length' ], 0 ) === 1;

			if ( ! isOnlyOneAllowedBlock ) {
				return false;
			}

			const parentAllowedBlocks = get( parentBlockListSettings, [ 'allowedBlocks' ] );

			const {
				getInsertionIndex,
			} = select( 'core/block-editor' );

			const {
				insertBlock,
			} = dispatch( 'core/block-editor' );
			const insertedBlock = createBlock( parentAllowedBlocks[ 0 ] );
			insertBlock(
				insertedBlock,
				getInsertionIndex( clientId, destinationRootClientId, isAppender ),
				rootClientId
			);
		}

		return {
			createIfOne,
		};
	} ),
	ifCondition( ( { hasItems } ) => hasItems ),
] )( Inserter );
