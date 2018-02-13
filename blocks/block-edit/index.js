/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { withSelect } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';
import { withContext, withFilters, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getBlockType,
	getBlockDefaultClassName,
	hasBlockSupport,
} from '../api';
import { withEditBlockContextProvider } from './context';

export class BlockEdit extends Component {
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

	render() {
		const { name, attributes = {}, isSelected } = this.props;
		const blockType = getBlockType( name );

		if ( ! blockType ) {
			return null;
		}

		// Generate a class name for the block's editable form
		const generatedClassName = hasBlockSupport( blockType, 'className', true ) ?
			getBlockDefaultClassName( name ) :
			null;
		const className = classnames( generatedClassName, attributes.className );

		// `edit` and `save` are functions or components describing the markup
		// with which a block is displayed. If `blockType` is valid, assign
		// them preferentially as the render value for the block.
		const Edit = blockType.edit || blockType.save;

		// For backwards compatibility concerns adds a focus and setFocus prop
		// These should be removed after some time (maybe when merging to Core)
		return (
			<Edit
				{ ...this.props }
				className={ className }
				focus={ isSelected ? {} : false }
				setFocus={ noop }
			/>
		);
	}
}

BlockEdit.childContextTypes = {
	BlockList: noop,
	canUserUseUnfilteredHTML: noop,
};

export default compose( [
	withEditBlockContextProvider,
	withFilters( 'blocks.BlockEdit' ),
	withSelect( ( select ) => ( {
		postType: select( 'core/editor' ).getEditedPostAttribute( 'type' ),
	} ) ),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
	withContext( 'createInnerBlockList' )(),
] )( BlockEdit );
