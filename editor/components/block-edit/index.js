/**
 * External dependencies
 */
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';
import { withContext, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Edit from './edit';
import { BlockEditContextProvider } from './context';

export class BlockEdit extends Component {
	constructor( props ) {
		super( props );

		this.setFocusedElement = this.setFocusedElement.bind( this );

		this.state = {
			focusedElement: null,
			setFocusedElement: this.setFocusedElement,
			attributes: {},
			setAttributes: noop,
		};
	}

	getChildContext() {
		const {
			id: uid,
			user,
			createInnerBlockList,
		} = this.props;

		return {
			uid,
			BlockList: createInnerBlockList( uid ),
			canUserUseUnfilteredHTML: get( user.data, [
				'capabilities',
				'unfiltered_html',
			], false ),
		};
	}

	setFocusedElement( focusedElement ) {
		this.setState( ( prevState ) => {
			if ( prevState.focusedElement === focusedElement ) {
				return null;
			}
			return { focusedElement };
		} );
	}

	static getDerivedStateFromProps( { name, isSelected, attributes, setAttributes }, prevState ) {
		if (
			name === prevState.name &&
			isSelected === prevState.isSelected
		) {
			return null;
		}

		return {
			...prevState,
			name,
			isSelected,
			attributes,
			setAttributes,
		};
	}

	render() {
		return (
			<BlockEditContextProvider value={ this.state }>
				<Edit { ...this.props } />
			</BlockEditContextProvider>
		);
	}
}

BlockEdit.childContextTypes = {
	uid: noop,
	BlockList: noop,
	canUserUseUnfilteredHTML: noop,
};

export default compose( [
	withSelect( ( select ) => ( {
		postType: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
	} ) ),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
	withContext( 'createInnerBlockList' )(),
] )( BlockEdit );
