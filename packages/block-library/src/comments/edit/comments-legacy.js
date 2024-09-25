/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	Warning,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import Placeholder from './placeholder';

export default function CommentsLegacy( {
	attributes,
	setAttributes,
	context: { postType, postId },
} ) {
	const { textAlign } = attributes;

	const actions = [
		<Button
			__next40pxDefaultSize
			key="convert"
			onClick={ () => void setAttributes( { legacy: false } ) }
			variant="primary"
		>
			{ __( 'Switch to editable mode' ) }
		</Button>,
	];

	const blockProps = useBlockProps( {
		className: clsx( {
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
			</BlockControls>

			<div { ...blockProps }>
				<Warning actions={ actions }>
					{ __(
						'Comments block: You’re currently using the legacy version of the block. ' +
							'The following is just a placeholder - the final styling will likely look different. ' +
							'For a better representation and more customization options, ' +
							'switch the block to its editable mode.'
					) }
				</Warning>
				<Placeholder postId={ postId } postType={ postType } />
			</div>
		</>
	);
}
