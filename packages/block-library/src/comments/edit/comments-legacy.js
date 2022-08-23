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
			key="convert"
			onClick={ () => void setAttributes( { legacy: false } ) }
			variant="primary"
		>
			{ __( 'Switch to editable mode' ) }
		</Button>,
	];

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
			</BlockControls>

			<div { ...blockProps }>
				<Warning actions={ actions }>
					{ __(
						"Comments block: You're currently using the legacy version. " +
							'The following is just a placeholder -- it might look different on the frontend. ' +
							'For a better representation and more customization options, ' +
							'switch the block to its editable mode.'
					) }
				</Warning>
				<Placeholder postId={ postId } postType={ postType } />
			</div>
		</>
	);
}
