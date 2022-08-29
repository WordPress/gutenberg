/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import CommentsForm from './form';
import HeadingLevelDropdown from '../heading/heading-level-dropdown';

export default function PostCommentsFormEdit( {
	attributes,
	context,
	setAttributes,
} ) {
	const { textAlign, headingLevel } = attributes;
	const { postId, postType } = context;

	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
				<HeadingLevelDropdown
					selectedLevel={ headingLevel }
					onChange={ ( newHeadingLevel ) =>
						setAttributes( { headingLevel: newHeadingLevel } )
					}
				/>
			</BlockControls>
			<div { ...blockProps }>
				<CommentsForm
					headingLevel={ headingLevel }
					postId={ postId }
					postType={ postType }
				/>
			</div>
		</>
	);
}
