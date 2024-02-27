/**
 * External dependencies
 */
import { render, screen } from 'test/helpers';

/**
 * Internal dependencies
 */
import BlockOutline from '../block-outline';

describe( 'BlockOutline', () => {
	describe( 'when the block is a non-rich text design block', () => {
		describe( 'when selected', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="design"
						name="core/group"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="design"
						name="core/group"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a rich text design block', () => {
		describe( 'when selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="design"
						name="core/button"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="design"
						name="core/button"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a text block', () => {
		describe( 'when selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="text"
						name="core/paragraph"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="text"
						name="core/paragraph"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a social link block', () => {
		describe( 'when selected', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="embed"
						name="core/social-link"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="embed"
						name="core/social-link"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a media block', () => {
		describe( 'when selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="media"
						name="core/image"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="media"
						name="core/image"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a freeform block', () => {
		describe( 'when selected', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="text"
						name="core/freeform"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="text"
						name="core/freeform"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );

	describe( 'when the block is a missing block', () => {
		describe( 'when selected', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="text"
						name="core/missing"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );

		describe( 'when not selected', () => {
			it( 'should not render an outline', async () => {
				render(
					<BlockOutline
						isSelected={ false }
						blockCategory="text"
						name="core/missing"
					/>
				);

				expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
			} );
		} );
	} );
} );
