/**
 * WordPress dependencies
 */
import {
	Button,
	FormFileUpload,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import type { DataFormControlProps } from '../types';

export default function Image< Item >( {
	data,
	field,
	onChange,
}: DataFormControlProps< Item > ) {
	const { id } = field;
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
			{ value && (
				<img
					src={ value }
					alt=""
					style={ {
						maxWidth: '200px',
						maxHeight: '200px',
					} }
				/>
			) }
			<HStack>
				<FormFileUpload
					accept="image/*"
					onChange={ ( event ) => {
						if ( event.target.files?.length ) {
							const objectUrl = URL.createObjectURL(
								event.target.files[ 0 ]
							);
							onChangeControl( objectUrl );
						}
					} }
				>
					<Button variant="primary">Upload</Button>
				</FormFileUpload>
				{ value && (
					<Button
						variant="secondary"
						onClick={ () => {
							onChangeControl( '' );
						} }
					>
						Clean
					</Button>
				) }
			</HStack>
		</fieldset>
	);
}
