/**
 * WordPress dependencies
 */
import { HorizontalRule } from '@wordpress/components';
import { useBlockProps } from '@wordpress/block-editor';

export default function SeparatorEdit( { className } ) {
	return (
		<>
			<HorizontalRule
				{ ...useBlockProps( {
					className,
				} ) }
			/>
		</>
	);
}
