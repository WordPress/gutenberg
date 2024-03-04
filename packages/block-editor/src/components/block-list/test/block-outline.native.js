/**
 * External dependencies
 */
import { render, screen } from 'test/helpers';

/**
 * Internal dependencies
 */
import BlockOutline from '../block-outline';

describe( 'BlockOutline', () => {
	describe( 'containing an unselected block', () => {
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

	describe( 'containing a block with inner blocks', () => {
		it( 'should render an outline', async () => {
			render(
				<BlockOutline
					isSelected
					blockCategory="design"
					name="core/group"
					hasInnerBlocks
				/>
			);

			expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
		} );
	} );

	describe( 'containing a design category block', () => {
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

	describe( 'containing a text category block', () => {
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

		describe( 'with inner blocks', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="text"
						name="core/list"
						hasInnerBlocks
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );
	} );

	describe( 'containing a widget category block', () => {
		it( 'should render an outline', async () => {
			render(
				<BlockOutline
					isSelected
					blockCategory="widgets"
					name="core/latest-posts"
				/>
			);

			expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
		} );
	} );

	describe( 'containing a spacer block', () => {
		it( 'should not render an outline', async () => {
			render(
				<BlockOutline
					isSelected
					blockCategory="design"
					name="core/spacer"
				/>
			);

			expect( screen.queryByTestId( 'block-outline' ) ).toBeNull();
		} );
	} );

	describe( 'containing a button block', () => {
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

	describe( 'containing a social link block', () => {
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

		describe( 'when platform specific', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="embed"
						name="core/social-link-amazon"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );
	} );

	describe( 'containing a media block', () => {
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

		describe( 'with inner blocks', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="media"
						name="core/gallery"
						hasInnerBlocks
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );

			describe( 'when cover block', () => {
				it( 'should not render an outline', async () => {
					render(
						<BlockOutline
							isSelected
							blockCategory="media"
							name="core/cover"
							hasInnerBlocks
						/>
					);

					expect(
						screen.queryByTestId( 'block-outline' )
					).toBeNull();
				} );
			} );
		} );

		describe( 'when a file block', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="media"
						name="core/file"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );

		describe( 'when an audio block', () => {
			it( 'should render an outline', async () => {
				render(
					<BlockOutline
						isSelected
						blockCategory="media"
						name="core/audio"
					/>
				);

				expect( screen.getByTestId( 'block-outline' ) ).toBeVisible();
			} );
		} );
	} );

	describe( 'containing a freeform block', () => {
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

	describe( 'containing a missing block', () => {
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
} );
