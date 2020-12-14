/**
 * WordPress dependencies
 */
import { useRef, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import {
	BlockControls,
	InspectorAdvancedControls,
	useBlockProps,
} from '@wordpress/block-editor';
import {
	SelectControl,
	Dropdown,
	ToolbarGroup,
	ToolbarButton,
	Spinner,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chevronUp, chevronDown } from '@wordpress/icons';
import { serialize } from '@wordpress/blocks';
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
	const initialContent = useRef();

	// Resolve the post ID if not set, and load its post.
	const postId = useTemplatePartPost( _postId, slug, theme );

	// Set the postId block attribute if it did not exist,
	// but wait until the inner blocks have loaded to allow
	// new edits to trigger this.
	const { innerBlocks, expectedContent } = useSelect(
		( select ) => {
			const { getBlocks } = select( 'core/block-editor' );
			const entityRecord = select( 'core' ).getEntityRecord(
				'postType',
				'wp_template_part',
				postId
			);

			return {
				innerBlocks: getBlocks( clientId ),
				expectedContent: entityRecord?.content.raw,
			};
		},
		[ clientId, postId ]
	);
	const { editEntityRecord } = useDispatch( 'core' );
	useEffect( () => {
		// If postId (entity) has not resolved or _postId (block attr) is set,
		// then we have no need for this effect.
		if ( ! postId || _postId ) {
			return;
		}

		const innerContent = serialize( innerBlocks );

		// If we havent set initialContent, check if innerBlocks are loaded.
		if ( ! initialContent.current ) {
			// If the content of innerBlocks and the content from entity match,
			// then we can consider innerBlocks as loaded and set initialContent.
			if ( innerContent === expectedContent ) {
				initialContent.current = innerContent;
			}
			// Continue to return early until this effect is triggered
			// with innerBlocks already loaded (as denoted by initialContent being set).
			return;
		}

		// After initialContent is set and the content is updated, we can set the
		// postId block attribute and set the post status to 'publish'.
		// After this is done the hook will no longer run due to the first return above.
		if ( initialContent.current !== innerContent ) {
			setAttributes( { postId } );
			editEntityRecord( 'postType', 'wp_template_part', postId, {
				status: 'publish',
			} );
		}
	}, [ innerBlocks, expectedContent ] );

	const blockProps = useBlockProps();

	// Part of a template file, post ID already resolved.
	const isTemplateFile = !! postId;
	// Fresh new block.
	const isPlaceholder =
		! postId && ! initialSlug.current && ! initialTheme.current;
	// Part of a template file, post ID not resolved yet.
	const isUnresolvedTemplateFile = ! isPlaceholder && ! postId;

	const inspectorAdvancedControls = (
		<InspectorAdvancedControls>
			<SelectControl
				label={ __( 'HTML element' ) }
				options={ [
					{ label: __( 'Default (<div>)' ), value: 'div' },
					{ label: '<header>', value: 'header' },
					{ label: '<main>', value: 'main' },
					{ label: '<section>', value: 'section' },
					{ label: '<article>', value: 'article' },
					{ label: '<aside>', value: 'aside' },
					{ label: '<footer>', value: 'footer' },
				] }
				value={ TagName }
				onChange={ ( value ) => setAttributes( { tagName: value } ) }
			/>
		</InspectorAdvancedControls>
	);

	return (
		<>
			{ inspectorAdvancedControls }
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
										icon={
											isOpen ? chevronUp : chevronDown
										}
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
		</>
	);
}
