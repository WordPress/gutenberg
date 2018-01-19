/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton, withContext } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { Component, compose } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getEditorMode } from '../../store/selectors';
import {
	insertBlock,
	hideInsertionPoint,
	showInsertionPoint,
} from '../../store/actions';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const {
			insertIndex,
			onToggle,
		} = this.props;

		if ( isOpen ) {
			this.props.showInsertionPoint( insertIndex );
		} else {
			this.props.hideInsertionPoint();
		}

		// Surface toggle callback to parent component
		if ( onToggle ) {
			onToggle( isOpen );
		}
	}

	render() {
		const {
			position,
			children,
			onInsertBlock,
			insertionPoint,
			hasSupportedBlocks,
			isLocked,
		} = this.props;

		if ( ! hasSupportedBlocks || isLocked ) {
			return null;
		}

		return (
			<Dropdown
				className="editor-inserter"
				position={ position }
				onToggle={ this.onToggle }
				expandOnMobile
				renderToggle={ ( { onToggle, isOpen } ) => (
					<IconButton
						icon="insert"
						label={ __( 'Add block' ) }
						onClick={ onToggle }
						className="editor-inserter__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
					>
						{ children }
					</IconButton>
				) }
				renderContent={ ( { onClose } ) => {
					const onSelect = ( item ) => {
						onInsertBlock( item, insertionPoint );
						onClose();
					};

					return <InserterMenu onSelect={ onSelect } />;
				} }
			/>
		);
	}
}

export default compose( [
	connect(
		( state ) => {
			return {
				insertionPoint: getBlockInsertionPoint( state ),
				mode: getEditorMode( state ),
			};
		},
		( dispatch ) => ( {
			onInsertBlock( item, position ) {
				dispatch( insertBlock(
					createBlock( item.name, item.initialAttributes ),
					position
				) );
			},
			...bindActionCreators( {
				showInsertionPoint,
				hideInsertionPoint,
			}, dispatch ),
		} )
	),
	withContext( 'editor' )( ( settings ) => {
		const { blockTypes, templateLock } = settings;

		return {
			hasSupportedBlocks: true === blockTypes || ! isEmpty( blockTypes ),
			isLocked: !! templateLock,
		};
	} ),
] )( Inserter );
