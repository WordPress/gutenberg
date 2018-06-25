/**
 * External dependencies
 */
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';
import { withAPIData } from '@wordpress/components';

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
		};
	}

	getChildContext() {
		const { user } = this.props;

		return {
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

	static getDerivedStateFromProps( props ) {
		const { id, name, isSelected } = props;

		return {
			name,
			isSelected,
			uid: id,
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
	canUserUseUnfilteredHTML: noop,
};

export default compose( [
	withSelect( ( select ) => ( {
		postType: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
	} ) ),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
] )( BlockEdit );
