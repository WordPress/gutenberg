/**
 * External dependencies
 */
import {
	get,
} from 'lodash';
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
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

const defaultRenderToggle = ( { onToggle, disabled, isOpen, blockName = 'block' } ) => {
	const label = `${ __( 'Add' ) } ${ blockName }`;
	return (
		<IconButton
			icon="insert"
			label={ label }
			labelPosition="bottom"
			onClick={ onToggle }
			className="editor-inserter__toggle block-editor-inserter__toggle"
			aria-haspopup="true"
			aria-expanded={ isOpen }
			disabled={ disabled }
		/>
	);
};

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
			hasOneAllowedItem,
			blockName,
			createIfOne,
			renderToggle = defaultRenderToggle,
		} = this.props;

		if ( hasOneAllowedItem ) {
			onToggle = createIfOne;
		}

		return renderToggle( { onToggle, isOpen, disabled, blockName } );
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
		const { position } = this.props;
		const toggle = this.renderToggle;

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
		const { hasInserterItems, hasOneAllowedItem, getOneAllowedItemName } = select( 'core/block-editor' );

		return {
			hasItems: hasInserterItems( rootClientId ),
			hasOneAllowedItem: hasOneAllowedItem( rootClientId ),
			blockName: getOneAllowedItemName( rootClientId ),
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
