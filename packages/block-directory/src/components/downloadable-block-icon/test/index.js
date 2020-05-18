/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { BlockIcon } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import DownloadableBlockIcon from '../index';

const getContainer = ( { icon, title } ) => {
	return shallow( <DownloadableBlockIcon icon={ icon } title={ title } /> );
};

const IMAGE_URL = 'https://ps.w.org/listicles/assets/icon-128x128.png';
const ICON_SLUG = 'default';

describe( 'Downloadable Block Icon', () => {
	describe( 'icon rendering', () => {
		test( 'should render an <img> tag', () => {
			const wrapper = getContainer( {
				icon: IMAGE_URL,
				title: 'Block Name',
			} );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual( IMAGE_URL );
		} );

		test( 'should render an <img> tag if icon URL has query string', () => {
			const iconURLwithQueryString =
				IMAGE_URL + '?rev=2011672&test=234234';
			const wrapper = getContainer( {
				icon: iconURLwithQueryString,
				title: 'Block Name',
			} );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual(
				iconURLwithQueryString
			);
		} );

		test( 'should render a <BlockIcon/> component', () => {
			const wrapper = getContainer( {
				icon: ICON_SLUG,
				title: 'Block Name',
			} );
			expect( wrapper.find( BlockIcon ) ).toHaveLength( 1 );
		} );
	} );
} );
