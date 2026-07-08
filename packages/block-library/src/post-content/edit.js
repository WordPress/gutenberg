/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __, isRTL } from '@wordpress/i18n';
import {
	InspectorControls,
	useBlockProps,
	useInnerBlocksProps,
	RecursionProvider,
	useHasRecursion,
	Warning,
	privateApis as blockEditorPrivateApis,
	__experimentalUseBlockPreview as useBlockPreview,
	useSettings,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { parse, getBlockSupport } from '@wordpress/blocks';
import {
	useEntityProp,
	useEntityBlockEditor,
	store as coreStore,
} from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import {
	ToggleControl,
	__experimentalToolsPanelItem as ToolsPanelItem,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { useCanEditEntity } from '../utils/hooks';
import { unlock } from '../lock-unlock';

const { HTMLElementControl } = unlock( blockEditorPrivateApis );

function hasDropCapDisabled( align ) {
	return align === ( isRTL() ? 'left' : 'right' ) || align === 'center';
}

function DropCapControl( { clientId, attributes, setAttributes, name } ) {
	const [ isDropCapFeatureEnabled ] = useSettings( 'typography.dropCap' );
	const hasSelectedStyleState = useSelect(
		( select ) => {
			const { hasSelectedStyleState: hasSelectedBlockStyleState } =
				unlock( select( blockEditorStore ) );

			return hasSelectedBlockStyleState( clientId );
		},
		[ clientId ]
	);

	if ( ! isDropCapFeatureEnabled || hasSelectedStyleState ) {
		return null;
	}

	const { style, dropCap } = attributes;
	const textAlign = style?.typography?.textAlign;

	let helpText;
	if ( hasDropCapDisabled( textAlign ) ) {
		helpText = __( 'Not available for aligned text.' );
	} else if ( dropCap ) {
		helpText = __( 'Showing large initial letter.' );
	} else {
		helpText = __( 'Show a large initial letter.' );
	}

	const isDropCapControlEnabledByDefault = getBlockSupport(
		name,
		'typography.defaultControls.dropCap',
		false
	);

	return (
		<InspectorControls group="typography">
			<ToolsPanelItem
				hasValue={ () => !! dropCap }
				label={ __( 'Drop cap' ) }
				isShownByDefault={ isDropCapControlEnabledByDefault }
				onDeselect={ () => setAttributes( { dropCap: false } ) }
				resetAllFilter={ () => ( { dropCap: false } ) }
				panelId={ clientId }
			>
				<ToggleControl
					label={ __( 'Drop cap' ) }
					checked={ !! dropCap }
					onChange={ () => setAttributes( { dropCap: ! dropCap } ) }
					help={ helpText }
					disabled={ hasDropCapDisabled( textAlign ) }
				/>
			</ToolsPanelItem>
		</InspectorControls>
	);
}

function ReadOnlyContent( {
	parentLayout,
	layoutClassNames,
	userCanEdit,
	postType,
	postId,
	tagName: TagName = 'div',
	dropCap,
} ) {
	const [ , , content ] = useEntityProp(
		'postType',
		postType,
		'content',
		postId
	);
	const blockProps = useBlockProps( {
		className: clsx( layoutClassNames, {
			'has-drop-cap': dropCap,
		} ),
	} );
	const blocks = useMemo( () => {
		return content?.raw ? parse( content.raw ) : [];
	}, [ content?.raw ] );
	const blockPreviewProps = useBlockPreview( {
		blocks,
		props: blockProps,
		layout: parentLayout,
	} );

	if ( userCanEdit ) {
		/*
		 * Rendering the block preview using the raw content blocks allows for
		 * block support styles to be generated and applied by the editor.
		 *
		 * The preview using the raw blocks can only be presented to users with
		 * edit permissions for the post to prevent potential exposure of private
		 * block content.
		 */
		return <div { ...blockPreviewProps }></div>;
	}

	return content?.protected ? (
		<TagName { ...blockProps }>
			<Warning>{ __( 'This content is password protected.' ) }</Warning>
		</TagName>
	) : (
		<TagName
			{ ...blockProps }
			dangerouslySetInnerHTML={ { __html: content?.rendered } }
		></TagName>
	);
}

function EditableContent( {
	context = {},
	tagName: TagName = 'div',
	dropCap,
} ) {
	const { postType, postId } = context;

	const [ blocks, onInput, onChange ] = useEntityBlockEditor(
		'postType',
		postType,
		{ id: postId }
	);

	const entityRecord = useSelect(
		( select ) => {
			return select( coreStore ).getEntityRecord(
				'postType',
				postType,
				postId
			);
		},
		[ postType, postId ]
	);

	const hasInnerBlocks = !! entityRecord?.content?.raw || blocks?.length;

	const initialInnerBlocks = [ [ 'core/paragraph' ] ];

	const props = useInnerBlocksProps(
		useBlockProps( {
			className: clsx( 'entry-content', {
				'has-drop-cap': dropCap,
			} ),
		} ),
		{
			value: blocks,
			onInput,
			onChange,
			template: ! hasInnerBlocks ? initialInnerBlocks : undefined,
		}
	);
	return <TagName { ...props } />;
}

function Content( props ) {
	const {
		context: { queryId, postType, postId } = {},
		layoutClassNames,
		tagName,
		dropCap,
	} = props;
	const userCanEdit = useCanEditEntity( 'postType', postType, postId );
	if ( userCanEdit === undefined ) {
		return null;
	}

	const isDescendentOfQueryLoop = Number.isFinite( queryId );
	const isEditable = userCanEdit && ! isDescendentOfQueryLoop;

	return isEditable ? (
		<EditableContent { ...props } />
	) : (
		<ReadOnlyContent
			parentLayout={ props.parentLayout }
			layoutClassNames={ layoutClassNames }
			userCanEdit={ userCanEdit }
			postType={ postType }
			postId={ postId }
			tagName={ tagName }
			dropCap={ dropCap }
		/>
	);
}

function Placeholder( { layoutClassNames } ) {
	const blockProps = useBlockProps( { className: layoutClassNames } );
	return (
		<div { ...blockProps }>
			<p>
				{ __(
					'This is the Content block, it will display all the blocks in any single post or page.'
				) }
			</p>
			<p>
				{ __(
					'That might be a simple arrangement like consecutive paragraphs in a blog post, or a more elaborate composition that includes image galleries, videos, tables, columns, and any other block types.'
				) }
			</p>
			<p>
				{ __(
					'If there are any Custom Post Types registered at your site, the Content block can display the contents of those entries as well.'
				) }
			</p>
		</div>
	);
}

function RecursionError() {
	const blockProps = useBlockProps();
	return (
		<div { ...blockProps }>
			<Warning>
				{ __( 'Block cannot be rendered inside itself.' ) }
			</Warning>
		</div>
	);
}

/**
 * Render inspector controls for the PostContent block.
 *
 * @param {Object}   props                 Component props.
 * @param {string}   props.tagName         The HTML tag name.
 * @param {Function} props.onSelectTagName onChange function for the SelectControl.
 * @param {string}   props.clientId        The client ID of the current block.
 * @param {Object}   props.attributes      Block attributes.
 * @param {Function} props.setAttributes   Function to set block attributes.
 * @param {string}   props.name            Block name.
 *
 * @return {React.JSX.Element}                The control group.
 */
function PostContentEditControls( {
	tagName,
	onSelectTagName,
	clientId,
	attributes,
	setAttributes,
	name,
} ) {
	return (
		<>
			<InspectorControls group="advanced">
				<HTMLElementControl
					tagName={ tagName }
					onChange={ onSelectTagName }
					clientId={ clientId }
					options={ [
						{ label: __( 'Default (<div>)' ), value: 'div' },
						{ label: '<main>', value: 'main' },
						{ label: '<section>', value: 'section' },
						{ label: '<article>', value: 'article' },
					] }
				/>
			</InspectorControls>
			<DropCapControl
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				name={ name }
			/>
		</>
	);
}

export default function PostContentEdit( {
	context,
	attributes,
	setAttributes,
	clientId,
	__unstableLayoutClassNames: layoutClassNames,
	__unstableParentLayout: parentLayout,
	name,
} ) {
	const { tagName = 'div', dropCap } = attributes;

	const { postId: contextPostId, postType: contextPostType } = context;
	const hasAlreadyRendered = useHasRecursion( contextPostId );

	if ( contextPostId && contextPostType && hasAlreadyRendered ) {
		return <RecursionError />;
	}

	const handleSelectTagName = ( value ) => {
		setAttributes( { tagName: value } );
	};

	return (
		<>
			<PostContentEditControls
				tagName={ tagName }
				onSelectTagName={ handleSelectTagName }
				clientId={ clientId }
				attributes={ attributes }
				setAttributes={ setAttributes }
				name={ name }
			/>
			<RecursionProvider uniqueId={ contextPostId }>
				{ contextPostId && contextPostType ? (
					<Content
						context={ context }
						parentLayout={ parentLayout }
						layoutClassNames={ layoutClassNames }
						dropCap={ dropCap }
					/>
				) : (
					<Placeholder layoutClassNames={ layoutClassNames } />
				) }
			</RecursionProvider>
		</>
	);
}
