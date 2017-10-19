/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { Dropdown, IconButton } from '@wordpress/components';
import { createBlock } from '@wordpress/blocks';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import InserterMenu from './menu';
import { getBlockInsertionPoint, getEditorMode } from '../selectors';
import {
	insertBlock,
	setBlockInsertionPoint,
	clearBlockInsertionPoint,
	hideInsertionPoint,
} from '../actions';

class Inserter extends Component {
	constructor() {
		super( ...arguments );

		this.onToggle = this.onToggle.bind( this );
	}

	onToggle( isOpen ) {
		const {
			insertIndex,
			setInsertionPoint,
			clearInsertionPoint,
			onToggle,
		} = this.props;

		// When inserting at specific index, assign as insertion point when
		// the inserter is opened, clearing on close.
		if ( insertIndex !== undefined ) {
			if ( isOpen ) {
				setInsertionPoint( insertIndex );
			} else {
				clearInsertionPoint();
			}
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
		} = this.props;

		return (
			<Dropdown
				className="editor-inserter"
				position={ position }
				onToggle={ this.onToggle }
				renderToggle={ ( { onToggle, isOpen } ) => (
					<IconButton
						icon="insert"
						label={ __( 'Insert block' ) }
						onClick={ onToggle }
						className="editor-inserter__toggle"
						aria-haspopup="true"
						aria-expanded={ isOpen }
					>
						{ children }
					</IconButton>
				) }
				renderContent={ ( { onClose } ) => {
					const onInsert = ( name ) => {
						onInsertBlock(
							name,
							insertionPoint
						);

						onClose();
					};

					return <InserterMenu onSelect={ onInsert } />;
				} }
			/>
		);
	}
}

export default connect(
	( state ) => {
		return {
			insertionPoint: getBlockInsertionPoint( state ),
			mode: getEditorMode( state ),
		};
	},
	( dispatch ) => ( {
		onInsertBlock( name, position ) {
			dispatch( hideInsertionPoint() );
			dispatch( insertBlock(
				createBlock( name ),
				position
			) );
		},
		...bindActionCreators( {
			setInsertionPoint: setBlockInsertionPoint,
			clearInsertionPoint: clearBlockInsertionPoint,
		}, dispatch ),
	} )
)( Inserter );
