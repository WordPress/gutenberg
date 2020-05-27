/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { DownloadableBlockHeader } from '../index';
import { pluginWithImg, pluginWithIcon } from './fixtures';

const getContainer = (
	{ icon, title, rating, ratingCount },
	onClick = jest.fn(),
	isLoading = false
) => {
	return shallow(
		<DownloadableBlockHeader
			icon={ icon }
			onClick={ onClick }
			title={ title }
			rating={ rating }
			ratingCount={ ratingCount }
			isLoading={ isLoading }
		/>
	);
};

describe( 'DownloadableBlockHeader', () => {
	describe( 'icon rendering', () => {
		test( 'should render an <img> tag', () => {
			const wrapper = getContainer( pluginWithImg );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual(
				pluginWithImg.icon
			);
		} );

		test( 'should render an <img> tag if icon URL has query string', () => {
			const iconURLwithQueryString =
				pluginWithImg.icon + '?rev=2011672&test=234234';
			const plugin = { ...pluginWithImg, icon: iconURLwithQueryString };
			const wrapper = getContainer( plugin );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual(
				plugin.icon
			);
		} );

		test( 'should render a <BlockIcon/> component', () => {
			const wrapper = getContainer( pluginWithIcon );
			expect( wrapper.find( BlockIcon ) ).toHaveLength( 1 );
		} );
	} );

	describe( 'user interaction', () => {
		test( 'should trigger the onClick function', () => {
			const onClickMock = jest.fn();
			const wrapper = getContainer( pluginWithIcon, onClickMock );
			const event = {
				preventDefault: jest.fn(),
			};
			wrapper.find( Button ).simulate( 'click', event );
			expect( onClickMock ).toHaveBeenCalledTimes( 1 );
			expect( event.preventDefault ).toHaveBeenCalled();
		} );

		test( 'should not trigger the onClick function if loading', () => {
			const onClickMock = jest.fn();
			const wrapper = getContainer( pluginWithIcon, onClickMock, true );
			const event = {
				preventDefault: jest.fn(),
			};
			wrapper.find( Button ).simulate( 'click', event );
			expect( event.preventDefault ).toHaveBeenCalled();
			expect( onClickMock ).toHaveBeenCalledTimes( 0 );
		} );
	} );
} );
