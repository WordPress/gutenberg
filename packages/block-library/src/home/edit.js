/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

const preventDefault = ( event ) => event.preventDefault();

export default function HomeEdit( { attributes, setAttributes, clientId } ) {
	const blockProps = useBlockProps();
	const { homeUrl } = useSelect(
		( select ) => {
			const {
				getUnstableBase, //site index
			} = select( coreStore );
			return {
				homeUrl: getUnstableBase()?.home,
			};
		},
		[ clientId ]
	);

	const { label } = attributes;

	return (
		<li { ...blockProps }>
			<a
				className="wp-block-home__content"
				href={ homeUrl }
				onClick={ preventDefault }
			>
				<RichText
					identifier="label"
					className="wp-block-home__label"
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
		</li>
	);
}
