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
						"Comments block: You're currently using this block in legacy mode. " +
							'The following is just a placeholder, not a real comment. ' +
							'The final styling may differ because it also depends on the current theme. ' +
							'For better compatibility with the Block Editor, ' +
							'please consider switching the block to its editable mode.'
					) }
				</Warning>
				<Placeholder postId={ postId } postType={ postType } />
			</div>
		</>
	);
}
