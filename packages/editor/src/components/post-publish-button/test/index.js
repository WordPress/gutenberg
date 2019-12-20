/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { PostPublishButton } from '../';

describe( 'PostPublishButton', () => {
	describe( 'aria-disabled', () => {
		it( 'should be true if post is currently saving', () => {
			const wrapper = shallow(
				<PostPublishButton
					isPublishable
					isSaveable
					isSaving
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should be true if forceIsSaving is true', () => {
			const wrapper = shallow(
				<PostPublishButton
					isPublishable
					isSaveable
					forceIsSaving
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should be true if post is not publishable and not forceIsDirty', () => {
			const wrapper = shallow(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty={ false }
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should be true if post is not saveable', () => {
			const wrapper = shallow(
				<PostPublishButton
					isPublishable
					isSaveable={ false }
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should be true if post saving is locked', () => {
			const wrapper = shallow(
				<PostPublishButton
					isPublishable
					isSaveable
					isPostSavingLocked
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( true );
		} );

		it( 'should be false if post is saveable but not publishable and forceIsDirty is true', () => {
			const wrapper = shallow(
				<PostPublishButton
					isSaveable
					isPublishable={ false }
					forceIsDirty
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( false );
		} );

		it( 'should be false if post is publishave and saveable', () => {
			const wrapper = shallow(
				<PostPublishButton
					isPublishable
					isSaveable
				/>
			);

			expect( wrapper.find( Button ).prop( 'aria-disabled' ) ).toBe( false );
		} );
	} );

	describe( 'publish status', () => {
		it( 'should be pending for contributor', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PostPublishButton
					hasPublishAction={ false }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					isSaveable={ true }
					isPublishable={ true }
				/>
			);

			wrapper.find( Button ).simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'pending' );
		} );

		it( 'should be future for scheduled post', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PostPublishButton
					hasPublishAction={ true }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					isBeingScheduled
					isSaveable={ true }
					isPublishable={ true } />
			);

			wrapper.find( Button ).simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'future' );
		} );

		it( 'should be private for private visibility', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PostPublishButton
					hasPublishAction={ true }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					visibility="private"
					isSaveable={ true }
					isPublishable={ true } />
			);

			wrapper.find( Button ).simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'private' );
		} );

		it( 'should be publish otherwise', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PostPublishButton
					hasPublishAction={ true }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					isSaveable={ true }
					isPublishable={ true } />
			);

			wrapper.find( Button ).simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'publish' );
		} );
	} );

	describe( 'click', () => {
		it( 'should save with status', () => {
			const onStatusChange = jest.fn();
			const onSave = jest.fn();
			const wrapper = shallow(
				<PostPublishButton
					hasPublishAction={ true }
					onStatusChange={ onStatusChange }
					onSave={ onSave }
					isSaveable={ true }
					isPublishable={ true } />
			);

			wrapper.find( Button ).simulate( 'click' );

			expect( onStatusChange ).toHaveBeenCalledWith( 'publish' );
			expect( onSave ).toHaveBeenCalled();
		} );
	} );

	it( 'should have save modifier class', () => {
		const wrapper = shallow(
			<PostPublishButton
				isSaving
				isPublished
			/>
		);

		expect( wrapper.find( Button ).prop( 'isBusy' ) ).toBe( true );
	} );
} );
