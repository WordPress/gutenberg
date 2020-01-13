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
import DownloadableBlockHeader from '../index';
import { pluginWithImg, pluginWithIcon } from './fixtures';

const getContainer = ( { icon, title, rating, ratingCount } ) => {
	return shallow(
		<DownloadableBlockHeader
			icon={ icon }
			onClick={ () => {} }
			title={ title }
			rating={ rating }
			ratingCount={ ratingCount }
		/>
	);
};

describe( 'DownloadableBlockHeader', () => {
	describe( 'icon rendering', () => {
		test( 'should render an <img> tag', () => {
			const wrapper = getContainer( pluginWithImg );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual( pluginWithImg.icon );
		} );

		test( 'should render an <img> tag if icon URL has query string', () => {
			const iconURLwithQueryString = pluginWithImg.icon + '?rev=2011672&test=234234';
			const plugin = { ...pluginWithImg, icon: iconURLwithQueryString };
			const wrapper = getContainer( plugin );
			expect( wrapper.find( 'img' ).prop( 'src' ) ).toEqual( plugin.icon );
		} );

		test( 'should render a <BlockIcon/> component', () => {
			const wrapper = getContainer( pluginWithIcon );
			expect( wrapper.find( BlockIcon ) ).toHaveLength( 1 );
		} );
	} );
} );
