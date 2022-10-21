/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { level, summary, showContent } = attributes;
	const TagName = 'h' + level;
	const blockProps = useBlockProps.save();

	return (
		<details { ...blockProps } open={ showContent }>
			<summary className={ classnames( 'wp-block-details__summary' ) }>
				<TagName>
					<RichText.Content value={ summary } />
				</TagName>
			</summary>
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-details__content',
				} ) }
			/>
		</details>
	);
}
