import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import TreeGrid from '..';
import TreeGridRow from '../row';
import TreeGridCell from '../cell';

describe( 'TreeGrid', () => {
	describe( 'simple rendering', () => {
		it( 'renders a table, tbody and any child elements', () => {
			const { container } = render(
				<TreeGrid>
					<TreeGridRow level={ 1 } positionInSet={ 1 } setSize={ 1 }>
						<TreeGridCell withoutGridItem>Test</TreeGridCell>
					</TreeGridRow>
				</TreeGrid>
			);

			expect( container.innerHTML ).toMatchSnapshot();
		} );
	} );
} );
