/**
 * WordPress dependencies
 */
import { BlockIcon, RichText, useInnerBlocksProps, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes: { summary } } ) {
	return (
		<details { ...useBlockProps.save() }>
			<summary>
				<span className="wp-block-details__summary-text">
					<RichText.Content value={ summary } />
				</span>
			</summary>
			<div
				{ ...useInnerBlocksProps.save( {
					className: 'wp-block-details__inner-container',
				} ) }
			/>
		</details>
	);
}
