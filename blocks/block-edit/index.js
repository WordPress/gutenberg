/**
 * External dependencies
 */
import classnames from 'classnames';
import { noop, get } from 'lodash';

/**
 * WordPress dependencies
 */
import { query } from '@wordpress/data';
import { Component, compose } from '@wordpress/element';
import { withFilters, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { createInnerBlockList } from './utils';
import {
	getBlockType,
	getBlockDefaultClassname,
	hasBlockSupport,
} from '../api';

export class BlockEdit extends Component {
	getChildContext() {
		const {
			id: uid,
			renderBlockMenu,
			showContextualToolbar,
			user,
		} = this.props;

		return {
			BlockList: createInnerBlockList(
				uid,
				renderBlockMenu,
				showContextualToolbar
			),
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
			getBlockDefaultClassname( name ) :
			null;
		const className = classnames( generatedClassName, attributes.className );

		// `edit` and `save` are functions or components describing the markup
		// with which a block is displayed. If `blockType` is valid, assign
		// them preferencially as the render value for the block.
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
	withFilters( 'blocks.BlockEdit' ),
	query( ( select ) => ( {
		postType: select( 'core/editor', 'getCurrentPostType' ),
	} ) ),
	withAPIData( ( { postType } ) => ( {
		user: `/wp/v2/users/me?post_type=${ postType }&context=edit`,
	} ) ),
] )( BlockEdit );
