/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	BaseControl,
	VisuallyHidden,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';
import { __ } from '@wordpress/i18n';

export default function Image< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { id, label } = field;
	const value = field.getValue( { item: data } );

	const onChangeControl = useCallback(
		( newValue: string ) =>
			onChange( {
				[ id ]: newValue,
			} ),
		[ id, onChange ]
	);

	return (
		<fieldset className="dataviews-controls__image">
			{ hideLabelFromVision ? (
				<VisuallyHidden as="legend">{ label }</VisuallyHidden>
			) : (
				<BaseControl.VisualLabel as="legend">
					{ label }
				</BaseControl.VisualLabel>
			) }
			<VStack
				className="dataviews-controls__image-container"
				justify="flex-start"
			>
				{ value && <img src={ value } alt="" /> }
				{ ! value && (
					<span className="dataviews-controls__image-placeholder" />
				) }
				<HStack justify="flex-start">
					<FormFileUpload
						accept="image/*"
						__next40pxDefaultSize
						onChange={ ( event ) => {
							if ( event.target.files?.length ) {
								const objectUrl = URL.createObjectURL(
									event.target.files[ 0 ]
								);
								onChangeControl( objectUrl );
							}
						} }
					>
						<Button variant="primary">{ __( 'Upload' ) }</Button>
					</FormFileUpload>
					{ value && (
						<Button
							variant="secondary"
							onClick={ () => {
								onChangeControl( '' );
							} }
						>
							{ __( 'Remove' ) }
						</Button>
					) }
				</HStack>
			</VStack>
		</fieldset>
	);
}
