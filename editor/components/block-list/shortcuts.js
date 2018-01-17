/**
 * External dependencies
 */
import { connect } from 'react-redux';
import {
	map,
	find,
	first,
	castArray,
	every,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';
import { getPossibleShortcutTransformations } from '@wordpress/blocks';
import { keycodes } from '@wordpress/utils';

/**
 * Internal dependencies
 */
import { replaceBlocks, updateBlockAttributes } from '../../store/actions';

const { isAccess } = keycodes;

class BlockListShortcuts extends Component {
	constructor() {
		super( ...arguments );
		this.onKeyDown = this.onKeyDown.bind( this );
	}

	componentDidMount() {
		// Needs document to also work in inspector.
		// In other words, if there is selection, but no focus.
		document.addEventListener( 'keydown', this.onKeyDown );
	}

	componentWillUnmount() {
		document.removeEventListener( 'keydown', this.onKeyDown );
	}

	componentWillReceiveProps( nextProps ) {
		const prevCommonName = this.commonName;

		if ( nextProps.selectedBlock ) {
			this.blocks = [ nextProps.selectedBlock ];
			this.commonName = nextProps.selectedBlock.name;
		} else if ( nextProps.multiSelectedBlocks.length ) {
			this.blocks = nextProps.multiSelectedBlocks;

			const firstName = first( nextProps.multiSelectedBlocks ).name;

			if ( every( nextProps.multiSelectedBlocks, ( { name } ) => name === firstName ) ) {
				this.commonName = firstName;
			} else {
				delete this.commonName;
			}
		} else {
			delete this.blocks;
			delete this.commonName;
		}

		if ( ! this.commonName ) {
			delete this.shortcutTransforms;
		} else if ( this.commonName !== prevCommonName ) {
			this.shortcutTransforms = getPossibleShortcutTransformations( this.commonName );
		}
	}

	onKeyDown( event ) {
		const { onReplace, onChange } = this.props;

		if ( ! this.shortcutTransforms || ! isAccess( event ) ) {
			return;
		}

		const transform = find( this.shortcutTransforms, ( { shortcut } ) => isAccess( event, shortcut ) );

		if ( ! transform ) {
			return;
		}

		const result = transform.transform( map( this.blocks, 'attributes' ) );

		// Check if we received blocks or attributes.
		if ( result.uid || Array.isArray( result ) ) {
			onReplace( map( this.blocks, 'uid' ), castArray( result ) );
		} else {
			this.blocks.forEach( ( { uid } ) => {
				onChange( uid, result );
			} );
		}
	}

	render() {
		return null;
	}
}

export default connect(
	null,
	( dispatch ) => ( {
		onReplace( uids, blocks ) {
			dispatch( replaceBlocks( uids, blocks ) );
		},
		onChange( uid, attributes ) {
			dispatch( updateBlockAttributes( uid, attributes ) );
		},
	} )
)( BlockListShortcuts );
