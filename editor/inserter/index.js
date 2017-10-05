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

		this.toggleInsertionPoint = this.toggleInsertionPoint.bind( this );
	}

	toggleInsertionPoint( isOpen ) {
		const {
			insertIndex,
			setInsertionPoint,
			clearInsertionPoint,
		} = this.props;

		if ( insertIndex !== undefined ) {
			if ( isOpen ) {
				setInsertionPoint( insertIndex );
			} else {
				clearInsertionPoint();
			}
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
				onToggle={ this.toggleInsertionPoint }
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
