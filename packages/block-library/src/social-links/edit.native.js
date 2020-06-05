/**
 * External dependencies
 */
import { View } from 'react-native';
/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { withDispatch, withSelect } from '@wordpress/data';
import { useRef, useEffect, useState } from '@wordpress/element';
import { compose } from '@wordpress/compose';

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
	clientId,
	shouldDelete,
	onDelete,
	isSelected,
	isInnerIconSelected,
	innerBlocks,
	replaceInnerBlocks,
} ) {
	const [ initialCreation, setInitialCreation ] = useState( true );
	const shouldRenderFooterAppender = isSelected || isInnerIconSelected;
	const { marginLeft: spacing } = styles.spacing;

	useEffect( () => {
		if ( ! shouldRenderFooterAppender && initialCreation ) {
			replaceInnerBlocks(
				clientId,
				innerBlocks.filter( ( block ) => block.attributes.url ),
				false
			);
			setInitialCreation( false );
		}
	}, [ shouldRenderFooterAppender ] );

	const renderFooterAppender = useRef( () => (
		<View>
			<InnerBlocks.ButtonBlockAppender isFloating={ true } />
		</View>
	) );

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
		} = select( 'core/block-editor' );
		const selectedBlockClientId = getSelectedBlockClientId();
		const selectedBlockParents = getBlockParents(
			selectedBlockClientId,
			true
		);
		const innerBlocks = getBlocks( clientId );

		return {
			shouldDelete: getBlockCount( clientId ) === 1,
			isInnerIconSelected: selectedBlockParents[ 0 ] === clientId,
			innerBlocks,
		};
	} ),
	withDispatch( ( dispatch, { clientId } ) => {
		const { removeBlock, replaceInnerBlocks } = dispatch(
			'core/block-editor'
		);

		return {
			onDelete: () => {
				removeBlock( clientId );
			},
			replaceInnerBlocks,
		};
	} )
)( SocialLinksEdit );
