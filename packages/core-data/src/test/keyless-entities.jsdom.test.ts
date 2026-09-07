/**
 * Type tests for keyless entities.
 *
 * The `root`/`site` entity is registered with `key: false`, so it holds a
 * single record that is addressed without a record ID. These tests pin the
 * signatures that make that callable, since they are otherwise only exercised
 * from untyped JavaScript.
 */
import { dispatch, select } from '@wordpress/data';
import { store as coreStore } from '../index';

describe( 'keyless entity types', () => {
	it( 'reads the site record without a record ID', () => {
		const read = () => {
			const { getEditedEntityRecord, getEntityRecordEdits } =
				select( coreStore );

			return [
				getEntityRecordEdits( 'root', 'site' ),
				getEditedEntityRecord( 'root', 'site' ),
			];
		};

		expect( read ).toBeInstanceOf( Function );
	} );

	it( 'edits and saves the site record without a record ID', () => {
		const write = async () => {
			const { editEntityRecord, saveEditedEntityRecord } =
				dispatch( coreStore );

			editEntityRecord( 'root', 'site', undefined, {
				site_icon: 123,
			} );

			await saveEditedEntityRecord( 'root', 'site' );
		};

		expect( write ).toBeInstanceOf( Function );
	} );
} );
