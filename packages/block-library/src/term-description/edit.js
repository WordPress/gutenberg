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
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';

export default function TermDescriptionEdit( {
	attributes,
	setAttributes,
	mergedStyle,
} ) {
	const { ArchiveDescription } = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		const { __experimentalArchiveDescription } = getSettings();
		return {
			ArchiveDescription: __experimentalArchiveDescription,
		};
	} );
	const { textAlign } = attributes;
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
		style: mergedStyle,
	} );

	const termDescription = ArchiveDescription || __( 'Term Description' );

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
				<div className="wp-block-term-description__placeholder">
					<span>{ termDescription }</span>
				</div>
			</div>
		</>
	);
}
