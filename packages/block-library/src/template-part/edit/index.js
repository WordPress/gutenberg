/**
 * WordPress dependencies
 */
import { useRef, useEffect, useState } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import {
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import useTemplatePartPost from './use-template-part-post';
import TemplatePartNamePanel from './name-panel';
import TemplatePartInnerBlocks from './inner-blocks';
import TemplatePartPlaceholder from './placeholder';
import TemplatePartSelection from './selection';

export default function TemplatePartEdit( {
	attributes: { postId: _postId, slug, theme, tagName: TagName = 'div' },
	setAttributes,
	clientId,
} ) {
	const initialSlug = useRef( slug );
	const initialTheme = useRef( theme );

	// Resolve the post ID if not set, and load its post.
	const postId = useTemplatePartPost( _postId, slug, theme );

	// Set the postId attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { innerBlocks, entityRecordEdits } = useSelect(
		( select ) => {
			const { getBlocks } = select( 'core/block-editor' );
			const { getEntityRecordEdits } = select( 'core' );
			return {
				innerBlocks: getBlocks( clientId ),
				entityRecordEdits: getEntityRecordEdits(
					'postType',
					'wp_template_part',
					postId
				),
			};
		},
		[ clientId, postId ]
	);
	const { editEntityRecord } = useDispatch( 'core' );
	const [ areInnerBlocksLoaded, setAreInnerBlocksLoaded ] = useState( false );
	useEffect( () => {
		if ( postId === null || postId === undefined ) {
			return;
		}

		if ( ! areInnerBlocksLoaded ) {
			if ( innerBlocks === entityRecordEdits?.blocks ) {
				setAreInnerBlocksLoaded( true );
			}
			return;
		}

		if ( _postId === null || _postId === undefined ) {
			setAttributes( { postId } );
			editEntityRecord( 'postType', 'wp_template_part', postId, {
				status: 'publish',
			} );
		}
	}, [ innerBlocks, entityRecordEdits?.blocks ] );

	const blockProps = useBlockProps();

	// Part of a template file, post ID already resolved.
	const isTemplateFile = !! postId;
	// Fresh new block.
	const isPlaceholder =
		! postId && ! initialSlug.current && ! initialTheme.current;
	// Part of a template file, post ID not resolved yet.
	const isUnresolvedTemplateFile = ! isPlaceholder && ! postId;

	return (
		<TagName { ...blockProps }>
			{ isPlaceholder && (
				<TemplatePartPlaceholder
					setAttributes={ setAttributes }
					innerBlocks={ innerBlocks }
				/>
			) }
			{ isTemplateFile && (
				<BlockControls>
					<ToolbarGroup className="wp-block-template-part__block-control-group">
						<TemplatePartNamePanel
							postId={ postId }
							setAttributes={ setAttributes }
						/>
						<Dropdown
							className="wp-block-template-part__preview-dropdown-button"
							contentClassName="wp-block-template-part__preview-dropdown-content"
							position="bottom right left"
							renderToggle={ ( { isOpen, onToggle } ) => (
								<ToolbarButton
									aria-expanded={ isOpen }
									icon={ isOpen ? chevronUp : chevronDown }
									label={ __( 'Choose another' ) }
									onClick={ onToggle }
									// Disable when open to prevent odd FireFox bug causing reopening.
									// As noted in https://github.com/WordPress/gutenberg/pull/24990#issuecomment-689094119 .
									disabled={ isOpen }
								/>
							) }
							renderContent={ ( { onClose } ) => (
								<TemplatePartSelection
									setAttributes={ setAttributes }
									onClose={ onClose }
								/>
							) }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ isTemplateFile && (
				<TemplatePartInnerBlocks
					postId={ postId }
					hasInnerBlocks={ innerBlocks.length > 0 }
				/>
			) }
			{ isUnresolvedTemplateFile && <Spinner /> }
		</TagName>
	);
}
