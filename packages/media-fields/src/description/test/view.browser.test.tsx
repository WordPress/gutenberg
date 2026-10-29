import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataViews } from '@wordpress/dataviews';
import type { Field, View } from '@wordpress/dataviews';
import '@wordpress/dataviews/build-style/style.css';
import '../../style.scss';
import descriptionField from '../index';
import captionField from '../../caption';
import mimeTypeField from '../../mime_type';
import type { MediaItem } from '../../types';

const longText =
	'This is a detailed description of the sample image. It contains useful information about what the image depicts and its context.';

const items = [
	{
		id: 1,
		description: { raw: longText, rendered: longText },
		caption: { raw: longText, rendered: longText },
		mime_type: 'image/jpeg',
	},
] as unknown as MediaItem[];

const fields = [
	descriptionField,
	captionField,
	mimeTypeField,
] as Field< MediaItem >[];

function MediaTable( { columns }: { columns: string[] } ) {
	const view: View = {
		type: 'table',
		fields: columns,
		page: 1,
		perPage: 10,
	};
	return (
		<div style={ { width: 1600 } }>
			<DataViews
				data={ items }
				fields={ fields }
				view={ view }
				onChangeView={ () => {} }
				getItemId={ ( item ) => String( item.id ) }
				paginationInfo={ { totalItems: 1, totalPages: 1 } }
				defaultLayouts={ { table: true } }
			/>
		</div>
	);
}

// The right edge of the text the user sees: where the text ends, or where
// its element clips it.
function getVisibleTextRight( element: HTMLElement ) {
	const range = document.createRange();
	range.selectNodeContents( element );
	const textRight = range.getBoundingClientRect().right;
	return getComputedStyle( element ).overflow === 'hidden'
		? Math.min( textRight, element.getBoundingClientRect().right )
		: textRight;
}

describe.each( [ 'description', 'caption' ] )(
	'%s field in a table',
	( fieldId ) => {
		it( 'keeps long text inside its column', async () => {
			render( <MediaTable columns={ [ fieldId, 'mime_type' ] } /> );
			const fileTypeCell = await screen.findByRole( 'cell', {
				name: 'image/jpeg',
			} );

			expect(
				getVisibleTextRight( screen.getByText( longText ) )
			).toBeLessThanOrEqual( fileTypeCell.getBoundingClientRect().left );
		} );
	}
);
