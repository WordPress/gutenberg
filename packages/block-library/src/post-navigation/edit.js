/**
 * WordPress dependencies
 */
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
} from '@wordpress/block-editor';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
const TEMPLATE = [
	[ 'core/post-navigation-link', { type: 'previous' } ],
	[ 'core/post-navigation-link' ],
];

const ALLOWED_BLOCKS = [ 'core/post-navigation-link' ];

export default function PostNavigationEdit( { setAttributes, attributes } ) {
	const { ariaLabel } = attributes;
	const blockProps = useBlockProps();

	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		template: TEMPLATE,
		allowedBlocks: ALLOWED_BLOCKS,
	} );
	return (
		<>
			<InspectorControls group="advanced">
				<TextControl
					__nextHasNoMarginBottom
					label={ __( 'Navigation name' ) }
					value={ ariaLabel || __( 'Posts' ) }
					onChange={ ( newLabel ) =>
						setAttributes( { ariaLabel: newLabel } )
					}
				/>
			</InspectorControls>
			<nav
				className="wp-block-post-navigation"
				aria-label={ ariaLabel || __( 'Posts' ) }
				{ ...innerBlocksProps }
			/>
		</>
	);
}
