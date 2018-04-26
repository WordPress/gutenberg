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
		this.state = {};
	}

	getChildContext() {
		const {
			id: uid,
			user,
			createInnerBlockList,
		} = this.props;

		return {
			BlockList: createInnerBlockList( uid ),
			canUserUseUnfilteredHTML: get( user.data, [
				'capabilities',
				'unfiltered_html',
			], false ),
		};
	}

	static getDerivedStateFromProps( nextProps, prevState ) {
		if ( nextProps.isSelected === get( prevState, [ 'context', 'isSelected' ] ) ) {
			return null;
		}

		return {
			context: {
				isSelected: nextProps.isSelected,
			},
		};
	}

	render() {
		return (
			<BlockEditContextProvider value={ this.state.context }>
				<Edit { ...this.props } />
			</BlockEditContextProvider>
		);
	}
}

BlockEdit.childContextTypes = {
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
