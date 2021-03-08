/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	AlignmentToolbar,
	BlockControls,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

/*
 * To do: Add the term to the query and use the context in the description block.
 * Only display the description on true term archive pages.
 * On other pages, display a message saying that there is no description.
 * In block.json, remove the context that is not used.
 * Eventually, make the term description editable.
 */

export default function QueryDescriptionEdit( { attributes, setAttributes } ) {
	const { textAlign } = attributes;
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	return (
		<>
			<BlockControls>
				<AlignmentToolbar
					value={ textAlign }
					onChange={ ( nextAlign ) => {
						setAttributes( { textAlign: nextAlign } );
					} }
				/>
			</BlockControls>
			<div { ...blockProps }>
				{ __( 'Query description placeholder' ) }
			</div>
		</>
	);
}
