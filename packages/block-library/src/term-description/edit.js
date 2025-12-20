/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	BlockControls,
	AlignmentControl,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { useTermDescription } from './use-term-description';

export default function TermDescriptionEdit( {
	attributes,
	setAttributes,
	mergedStyle,
	context: { termId, taxonomy },
} ) {
	const { textAlign } = attributes;
	const { termDescription } = useTermDescription( termId, taxonomy );

	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style: mergedStyle,
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
				{ termDescription ? (
					<div
						dangerouslySetInnerHTML={ { __html: termDescription } }
					/>
				) : (
					<div className="wp-block-term-description__placeholder">
						<span>{ __( 'Term Description' ) }</span>
					</div>
				) }
			</div>
		</>
	);
}
