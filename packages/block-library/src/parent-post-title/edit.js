/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import {
	AlignmentControl,
	BlockControls,
	InspectorControls,
	useBlockProps,
	HeadingLevelDropdown,
	useBlockEditingMode,
	Warning,
} from '@wordpress/block-editor';
import {
	ToggleControl,
	TextControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEntityProp, store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useToolsPanelDropdownMenuProps } from '../utils/hooks';

export default function ParentPostTitleEdit( {
	attributes: { level, levelOptions, textAlign, isLink, rel, linkTarget },
	setAttributes,
	context: { postType, postId },
} ) {
	const blockProps = useBlockProps( {
		className: clsx( {
			[ `has-text-align-${ textAlign }` ]: textAlign,
		} ),
	} );

	const TagName = level === 0 ? 'p' : `h${ level }`;
	const { parentPostId, supportsParent } = useSelect(
		( select ) => {
			const { getEditedEntityRecord, getPostType } = select( coreStore );
			const _parentId = getEditedEntityRecord(
				'postType',
				postType,
				postId
			)?.parent;

			return {
				parentPostId: _parentId,
				supportsParent:
					getPostType( postType )?.supports?.[ 'page-attributes' ] ??
					false,
			};
		},
		[ postType, postId ]
	);

	const blockEditingMode = useBlockEditingMode();
	const dropdownMenuProps = useToolsPanelDropdownMenuProps();
	const [ , , fullTitle ] = useEntityProp(
		'postType',
		postType,
		'title',
		parentPostId
	);
	const [ link ] = useEntityProp(
		'postType',
		postType,
		'link',
		parentPostId
	);

	// Early return if the post type does not support parent posts.
	if ( ! supportsParent ) {
		return (
			<div { ...blockProps }>
				<Warning>
					{ __(
						'This block is not supported for the current post type.'
					) }
				</Warning>
			</div>
		);
	}

	let titleElement = <TagName { ...blockProps }>{ __( 'Title' ) }</TagName>;

	if ( postType && parentPostId ) {
		titleElement = (
			<TagName
				{ ...blockProps }
				dangerouslySetInnerHTML={ { __html: fullTitle?.rendered } }
			/>
		);
	}

	if ( isLink && postType && parentPostId ) {
		titleElement = (
			<TagName { ...blockProps }>
				<a
					href={ link }
					target={ linkTarget }
					rel={ rel }
					onClick={ ( event ) => event.preventDefault() }
					dangerouslySetInnerHTML={ {
						__html: fullTitle?.rendered,
					} }
				/>
			</TagName>
		);
	}

	return (
		<>
			{ blockEditingMode === 'default' && (
				<>
					<BlockControls group="block">
						<HeadingLevelDropdown
							value={ level }
							options={ levelOptions }
							onChange={ ( newLevel ) =>
								setAttributes( { level: newLevel } )
							}
						/>
						<AlignmentControl
							value={ textAlign }
							onChange={ ( nextAlign ) => {
								setAttributes( { textAlign: nextAlign } );
							} }
						/>
					</BlockControls>
					<InspectorControls>
						<ToolsPanel
							label={ __( 'Settings' ) }
							resetAll={ () => {
								setAttributes( {
									rel: '',
									linkTarget: '_self',
									isLink: false,
								} );
							} }
							dropdownMenuProps={ dropdownMenuProps }
						>
							<ToolsPanelItem
								label={ __( 'Make title a link' ) }
								isShownByDefault
								hasValue={ () => isLink }
								onDeselect={ () =>
									setAttributes( { isLink: false } )
								}
							>
								<ToggleControl
									__nextHasNoMarginBottom
									label={ __( 'Make title a link' ) }
									onChange={ () =>
										setAttributes( { isLink: ! isLink } )
									}
									checked={ isLink }
								/>
							</ToolsPanelItem>
							{ isLink && (
								<>
									<ToolsPanelItem
										label={ __( 'Open in new tab' ) }
										isShownByDefault
										hasValue={ () =>
											linkTarget === '_blank'
										}
										onDeselect={ () =>
											setAttributes( {
												linkTarget: '_self',
											} )
										}
									>
										<ToggleControl
											__nextHasNoMarginBottom
											label={ __( 'Open in new tab' ) }
											onChange={ ( value ) =>
												setAttributes( {
													linkTarget: value
														? '_blank'
														: '_self',
												} )
											}
											checked={ linkTarget === '_blank' }
										/>
									</ToolsPanelItem>
									<ToolsPanelItem
										label={ __( 'Link rel' ) }
										isShownByDefault
										hasValue={ () => !! rel }
										onDeselect={ () =>
											setAttributes( { rel: '' } )
										}
									>
										<TextControl
											__next40pxDefaultSize
											__nextHasNoMarginBottom
											label={ __( 'Link rel' ) }
											value={ rel }
											onChange={ ( newRel ) =>
												setAttributes( { rel: newRel } )
											}
										/>
									</ToolsPanelItem>
								</>
							) }
						</ToolsPanel>
					</InspectorControls>
				</>
			) }
			{ titleElement }
		</>
	);
}
