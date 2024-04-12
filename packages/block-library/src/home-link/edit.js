/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useEffect } from '@wordpress/element';

const preventDefault = ( event ) => event.preventDefault();

export default function HomeEdit( { attributes, setAttributes } ) {
	const { homeUrl } = useSelect( ( select ) => {
		const {
			getUnstableBase, // Site index.
		} = select( coreStore );
		return {
			homeUrl: getUnstableBase()?.home,
		};
	}, [] );
	const { __unstableMarkNextChangeAsNotPersistent } =
		useDispatch( blockEditorStore );

	const blockProps = useBlockProps();

	const { label } = attributes;

	useEffect( () => {
		if ( label === undefined ) {
			__unstableMarkNextChangeAsNotPersistent();
			setAttributes( { label: __( 'Home' ) } );
		}
	}, [ __unstableMarkNextChangeAsNotPersistent, label, setAttributes ] );

	return (
		<>
			<div { ...blockProps }>
				<a href={ homeUrl } onClick={ preventDefault }>
					<RichText
						identifier="label"
						value={ label }
						onChange={ ( labelValue ) => {
							setAttributes( { label: labelValue } );
						} }
						aria-label={ __( 'Home link text' ) }
						placeholder={ __( 'Add home link' ) }
						withoutInteractiveFormatting
						allowedFormats={ [
							'core/bold',
							'core/italic',
							'core/image',
							'core/strikethrough',
						] }
					/>
				</a>
			</div>
		</>
	);
}
