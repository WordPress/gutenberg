/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { PostPublishPanelToggle } from '../toggle';

describe( 'PostPublishPanelToggle', () => {
	describe( 'disabled', () => {
		it( 'should be disabled if post is currently saving', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle
					isPublishable
					isSaveable
					isSaving
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is currently force saving', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle
					isPublishable
					isSaveable
					forceIsSaving
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is not publishable and not forceIsDirty', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle
					isSaveable
					isPublishable={ false }
					forceIsDirty={ false }
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is not saveable', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle
					isSaveable={ false }
					isPublishable
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be disabled if post is not published', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle isPublished={ false } />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( true );
		} );

		it( 'should be enabled if post is saveable but not publishable and forceIsDirty is true', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle
					isSaveable
					isPublishable={ false }
					forceIsDirty={ true }
				/>
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( false );
		} );

		it( 'should be enabled otherwise', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle isPublishable isSaveable />
			);

			expect( wrapper.prop( 'disabled' ) ).toBe( false );
		} );

		it( 'should display Schedule… if able to be scheduled', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle isPublishable isSaveable isBeingScheduled />
			);
			expect( wrapper.childAt( 0 ).text() ).toBe( 'Schedule…' );
		} );

		it( 'should display Publish… if able to be published', () => {
			const wrapper = shallow(
				<PostPublishPanelToggle isPublishable isSaveable hasPublishAction />
			);
			expect( wrapper.childAt( 0 ).text() ).toBe( 'Publish…' );
		} );
	} );
} );
