/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	AlignmentToolbar,
	BlockControls,
	__experimentalBlock as Block,
} from '@wordpress/block-editor';
import { ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

export default function PostTitleEdit( {
	attributes,
	setAttributes,
	context,
} ) {
	const { level, textAlign } = attributes;
	const { postType, postId } = context;
	const tagName = 0 === level ? 'p' : 'h' + level;

	const post = useSelect(
		( select ) =>
			select( 'core' ).getEditedEntityRecord(
				'postType',
				postType,
				postId
			),
		[ postType, postId ]
	);

	if ( ! post ) {
		return null;
	}

	const BlockWrapper = Block[ tagName ];

	return (
		<>
			<BlockControls>
				<ToolbarGroup>
					<HeadingLevelDropdown
						selectedLevel={ level }
						onChange={ ( newLevel ) =>
							setAttributes( { level: newLevel } )
						}
					/>
				</ToolbarGroup>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<BlockWrapper
				className={ classnames( {
					[ `has-text-align-${ textAlign }` ]: textAlign,
				} ) }
			>
				{ post.title || __( 'Post Title' ) }
			</BlockWrapper>
		</>
	);
}
