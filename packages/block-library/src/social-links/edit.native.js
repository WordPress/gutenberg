/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { compose, usePreferredColorSchemeStyle } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import styles from './editor.scss';
import variations from '../social-link/variations';

const ALLOWED_BLOCKS = variations.map(
	( v ) => `core/social-link-${ v.name }`
);

// Template contains the links that show when start.
const TEMPLATE = [
	[
		'core/social-link-wordpress',
		{ service: 'wordpress', url: 'https://wordpress.org' },
	],
	[ 'core/social-link-facebook', { service: 'facebook' } ],
	[ 'core/social-link-twitter', { service: 'twitter' } ],
	[ 'core/social-link-instagram', { service: 'instagram' } ],
];

function SocialLinksEdit( {
	shouldDelete,
	onDelete,
	isSelected,
	isInnerIconSelected,
	innerBlocks,
	attributes,
	activeInnerBlocks,
	getBlock,
} ) {
	const { align } = attributes;
	const shouldRenderFooterAppender = isSelected || isInnerIconSelected;
	const { marginLeft: spacing } = styles.spacing;

	const renderFooterAppender = useRef( () => (
		<View>
			<InnerBlocks.ButtonBlockAppender isFloating={ true } />
		</View>
	) );

	const placeholderStyle = usePreferredColorSchemeStyle(
		styles.placeholder,
		styles.placeholderDark
	);

	function renderPlaceholder() {
		return [ ...new Array( innerBlocks.length ) ].map( ( index ) => (
			<View style={ placeholderStyle } key={ index } />
		) );
	}

	function filterInnerBlocks( blockIds ) {
		return blockIds.filter(
			( blockId ) => getBlock( blockId ).attributes.url
		);
	}

	if ( ! shouldRenderFooterAppender && activeInnerBlocks.length === 0 ) {
		return (
			<View style={ styles.placeholderWrapper }>
				{ renderPlaceholder() }
			</View>
		);
	}

	return (
		<InnerBlocks
			allowedBlocks={ ALLOWED_BLOCKS }
			templateLock={ false }
			template={ TEMPLATE }
			renderFooterAppender={
				shouldRenderFooterAppender && renderFooterAppender.current
			}
			__experimentalMoverDirection={ 'horizontal' }
			onDeleteBlock={ shouldDelete ? onDelete : undefined }
			marginVertical={ spacing }
			marginHorizontal={ spacing }
			horizontalAlignment={ align }
			filterInnerBlocks={
				! shouldRenderFooterAppender && filterInnerBlocks
			}
		/>
	);
}

export default compose(
	withSelect( ( select, { clientId } ) => {
		const {
			getBlockCount,
			getBlockParents,
			getSelectedBlockClientId,
			getBlocks,
			getBlock,
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockParents = getBlockParents(
			selectedBlockClientId,
			true
		);
		const innerBlocks = getBlocks( clientId );
		const activeInnerBlocks = innerBlocks.filter(
			( block ) => block.attributes?.url
		);

		return {
			shouldDelete: getBlockCount( clientId ) === 1,
			isInnerIconSelected: selectedBlockParents[ 0 ] === clientId,
			innerBlocks,
			activeInnerBlocks,
			getBlock,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { removeBlock, replaceInnerBlocks } = dispatch(
			'core/block-editor'
		);

		return {
			onDelete: () => {
				removeBlock( clientId, false );
			},
			replaceInnerBlocks,
		};
	} )
)( SocialLinksEdit );
