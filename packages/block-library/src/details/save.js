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
import { __ } from '@wordpress/i18n';

export default function save( { attributes } ) {
	const { level, summary } = attributes;
	const TagName = 'h' + level;
	const blockProps = useBlockProps.save();

	return (
		<details { ...blockProps }>
			<summary className={ classnames( 'wp-block-details__summary' ) }>
				<TagName>
					<RichText.Content
						value={ !! summary ? summary : __( 'Show details' ) }
					/>
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
