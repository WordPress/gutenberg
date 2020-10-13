/**
 * External dependencies
 */
import classNames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';

export default function save( props ) {
	const {
		attributes: { iconSize },
	} = props;

	const className = classNames( iconSize );

	return (
		<ul { ...useBlockProps.save( { className } ) }>
			<InnerBlocks.Content />
		</ul>
	);
}
