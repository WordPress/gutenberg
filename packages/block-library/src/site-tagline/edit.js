/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import {
	AlignmentControl,
	useBlockProps,
	BlockControls,
	RichText,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

export default function SiteTaglineEdit( { attributes, setAttributes } ) {
	const { textAlign } = attributes;
	const [ siteTagline, setSiteTagline ] = useEntityProp(
		'root',
		'site',
		'description'
	);
	const { canUserEdit, readOnlySiteTagLine } = useSelect( ( select ) => {
		const { canUser, getEntityRecord } = select( coreStore );
		const siteData = getEntityRecord( 'root', '__unstableBase' );
		return {
			canUserEdit: canUser( 'update', 'settings' ),
			readOnlySiteTagLine: siteData?.description,
		};
	}, [] );
	const blockProps = useBlockProps( {
		className: classnames( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
			'wp-block-site-tagline__placeholder':
				! canUserEdit && ! readOnlySiteTagLine,
		} ),
	} );
	const siteTaglineContent = canUserEdit ? (
		<RichText
			allowedFormats={ [] }
			onChange={ setSiteTagline }
			aria-label={ __( 'Site tagline text' ) }
			placeholder={ __( 'Write site tagline…' ) }
			tagName="p"
			value={ siteTagline }
			{ ...blockProps }
		/>
	) : (
		<p { ...blockProps }>
			{ readOnlySiteTagLine || __( 'Site Tagline placeholder' ) }
		</p>
	);
	return (
		<>
			<BlockControls group="block">
				<AlignmentControl
					onChange={ ( newAlign ) =>
						setAttributes( { textAlign: newAlign } )
					}
					value={ textAlign }
				/>
			</BlockControls>
			{ siteTaglineContent }
		</>
	);
}
