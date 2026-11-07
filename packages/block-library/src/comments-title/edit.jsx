import {
	BlockControls,
	useBlockProps,
	InspectorControls,
	store as blockEditorStore,
	HeadingLevelDropdown,
} from '@wordpress/block-editor';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEntityProp } from '@wordpress/core-data';
import {
	ToggleControl,
	__experimentalToolsPanel as ToolsPanel,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import {
	usePostCommentsCount,
	useToolsPanelDropdownMenuProps,
} from '../utils/hooks';
import useDeprecatedTextAlign from '../utils/deprecated-text-align-attributes';

export default function Edit( props ) {
	useDeprecatedTextAlign( props );
	const { attributes, setAttributes, context } = props;
	const {
		showPostTitle,
		showCommentsCount,
		level = 2,
		levelOptions,
	} = attributes;
	const { postId, postType } = context;
	const TagName = 'h' + level;
	const [ rawTitle ] = useEntityProp( 'postType', postType, 'title', postId );
	const isSiteEditor = typeof postId === 'undefined';
	const blockProps = useBlockProps();

	const {
		threadCommentsDepth,
		threadComments,
		commentsPerPage,
		pageComments,
	} = useSelect( ( select ) => {
		const { getSettings } = select( blockEditorStore );
		return getSettings().__experimentalDiscussionSettings ?? {};
	}, [] );

	const dropdownMenuProps = useToolsPanelDropdownMenuProps();

	const { totalItems, hasResolved } = usePostCommentsCount( postId );
	let commentsCount;
	if ( isSiteEditor ) {
		// Match the number of comments that will be shown in the comment-template/edit.js placeholder

		const nestedCommentsNumber = threadComments
			? Math.min( threadCommentsDepth, 3 ) - 1
			: 0;
		const topLevelCommentsNumber = pageComments ? commentsPerPage : 3;

		const commentsNumber =
			parseInt( nestedCommentsNumber ) +
			parseInt( topLevelCommentsNumber );

		commentsCount = Math.min( commentsNumber, 3 );
	} else {
		// A failed request has no total.
		commentsCount = totalItems ?? ( hasResolved ? 0 : undefined );
	}

	const blockControls = (
		<BlockControls group="block">
			<HeadingLevelDropdown
				value={ level }
				options={ levelOptions }
				onChange={ ( newLevel ) =>
					setAttributes( { level: newLevel } )
				}
			/>
		</BlockControls>
	);

	const inspectorControls = (
		<InspectorControls>
			<ToolsPanel
				label={ __( 'Settings' ) }
				resetAll={ () => {
					setAttributes( {
						showPostTitle: true,
						showCommentsCount: true,
					} );
				} }
				dropdownMenuProps={ dropdownMenuProps }
			>
				<ToolsPanelItem
					label={ __( 'Show post title' ) }
					isShownByDefault
					hasValue={ () => ! showPostTitle }
					onDeselect={ () =>
						setAttributes( { showPostTitle: true } )
					}
				>
					<ToggleControl
						label={ __( 'Show post title' ) }
						checked={ showPostTitle }
						onChange={ ( value ) =>
							setAttributes( { showPostTitle: value } )
						}
					/>
				</ToolsPanelItem>
				<ToolsPanelItem
					label={ __( 'Show comments count' ) }
					isShownByDefault
					hasValue={ () => ! showCommentsCount }
					onDeselect={ () =>
						setAttributes( { showCommentsCount: true } )
					}
				>
					<ToggleControl
						label={ __( 'Show comments count' ) }
						checked={ showCommentsCount }
						onChange={ ( value ) =>
							setAttributes( { showCommentsCount: value } )
						}
					/>
				</ToolsPanelItem>
			</ToolsPanel>
		</InspectorControls>
	);

	const postTitle = isSiteEditor ? __( 'Post Title' ) : rawTitle;

	let placeholder;
	if ( showCommentsCount && commentsCount !== undefined ) {
		if ( showPostTitle ) {
			if ( commentsCount === 1 ) {
				placeholder = sprintf(
					/* translators: %s: Post title. */
					__( 'One response to "%s"' ),
					postTitle
				);
			} else {
				placeholder = sprintf(
					/* translators: 1: Number of comments, 2: Post title. */
					_n(
						'%1$s response to "%2$s"',
						'%1$s responses to "%2$s"',
						commentsCount
					),
					commentsCount,
					postTitle
				);
			}
		} else if ( commentsCount === 1 ) {
			placeholder = __( 'One response' );
		} else {
			placeholder = sprintf(
				/* translators: %s: Number of comments. */
				_n( '%s response', '%s responses', commentsCount ),
				commentsCount
			);
		}
	} else if ( showPostTitle ) {
		if ( commentsCount === 1 ) {
			/* translators: %s: Post title. */
			placeholder = sprintf( __( 'Response to "%s"' ), postTitle );
		} else {
			/* translators: %s: Post title. */
			placeholder = sprintf( __( 'Responses to "%s"' ), postTitle );
		}
	} else if ( commentsCount === 1 ) {
		placeholder = __( 'Response' );
	} else {
		placeholder = __( 'Responses' );
	}

	return (
		<>
			{ blockControls }
			{ inspectorControls }
			<TagName { ...blockProps }>{ placeholder }</TagName>
		</>
	);
}
