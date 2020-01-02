/**
 * External dependencies
 */
import { upperFirst } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */

import {
	InnerBlocks,
	BlockControls,
} from '@wordpress/block-editor';

import {
	Toolbar,
} from '@wordpress/components';

import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import socialList from '../social-link/social-list';
import * as navIcons from '../navigation/icons';

const ALLOWED_BLOCKS = Object.keys( socialList ).map( ( site ) => {
	return 'core/social-link-' + site;
} );

// Template contains the links that show when start.
const TEMPLATE = [
	[ 'core/social-link-wordpress', { url: 'https://wordpress.org' } ],
	[ 'core/social-link-facebook' ],
	[ 'core/social-link-twitter' ],
	[ 'core/social-link-instagram' ],
	[ 'core/social-link-linkedin' ],
	[ 'core/social-link-youtube' ],
];

export const SocialLinksEdit = function( { attributes, setAttributes, className } ) {
	const { itemsJustification } = attributes;

	const blockClassNames = classnames( className, {
		[ `items-justification-${ itemsJustification }` ]: itemsJustification,
	} );

	function handleItemsAlignment( align ) {
		return () => {
			const itemsJustificationSetting = itemsJustification === align ? undefined : align;
			setAttributes( {
				itemsJustification: itemsJustificationSetting,
			} );
		};
	}

	return (
		<div className={ blockClassNames }>

			<BlockControls>
				<Toolbar
					icon={ itemsJustification ? navIcons[ `justify${ upperFirst( itemsJustification ) }Icon` ] : navIcons.justifyLeftIcon }
					label={ __( 'Change items justification' ) }
					isCollapsed
					controls={ [
						{ icon: navIcons.justifyLeftIcon, title: __( 'Justify items left' ), isActive: 'left' === itemsJustification, onClick: handleItemsAlignment( 'left' ) },
						{ icon: navIcons.justifyCenterIcon, title: __( 'Justify items center' ), isActive: 'center' === itemsJustification, onClick: handleItemsAlignment( 'center' ) },
						{ icon: navIcons.justifyRightIcon, title: __( 'Justify items right' ), isActive: 'right' === itemsJustification, onClick: handleItemsAlignment( 'right' ) },
					] }
				/>
			</BlockControls>

			<InnerBlocks
				allowedBlocks={ ALLOWED_BLOCKS }
				templateLock={ false }
				template={ TEMPLATE }
				__experimentalMoverDirection={ 'horizontal' }
			/>
		</div>
	);
};

export default SocialLinksEdit;
