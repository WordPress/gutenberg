import { describe, expect, it } from 'vitest';
import * as mediaEditor from '../index';

describe( 'media editor public exports', () => {
	it( 'do not include the cropper, which is only available through the private API', () => {
		expect( Object.keys( mediaEditor ).sort() ).toEqual( [
			'MediaEditorProvider',
			'MediaForm',
			'MediaPreview',
			'privateApis',
		] );
	} );
} );
