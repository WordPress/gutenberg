/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withFilters } from '@wordpress/components';
import {
	getBlockDefaultClassName,
	hasBlockSupport,
	getBlockType,
	getBlockEdit,
} from '@wordpress/blocks';
import { AsyncModeProvider, useDispatch, useSelect } from '@wordpress/data';
import { useContext, useMemo, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import BlockContext from '../block-context';
import RichText from '../rich-text';
import { store as blockEditorStore } from '../../store';
import { unlock } from '../../lock-unlock';

/**
 * Default value used for blocks which do not define their own context needs,
 * used to guarantee that a block's `context` prop will always be an object. It
 * is assigned as a constant since it is always expected to be an empty object,
 * and in order to avoid unnecessary React reconciliations of a changing object.
 *
 * @type {{}}
 */
const DEFAULT_BLOCK_CONTEXT = {};

function useSelectedChildBlock( clientId ) {
	return useSelect(
		( select ) => {
			const {
				getSelectionStart,
				isBlockSelected,
				hasSelectedInnerBlock,
				getBlockAttributes,
				getBlockName,
			} = select( blockEditorStore );

			const isSelected =
				isBlockSelected( clientId ) ||
				hasSelectedInnerBlock( clientId, true );

			if ( ! isSelected ) {
				return {
					selClientId: null,
					selBlockName: null,
					selContent: undefined,
				};
			}

			const sClientId = getSelectionStart().clientId;
			return {
				selClientId: sClientId,
				selBlockName: getBlockName( sClientId ),
				selContent: getBlockAttributes( sClientId ).content,
			};
		},
		[ clientId ]
	);
}
function FallbackRichEdit( { clientId } ) {
	const ref = useRef();
	const { selClientId, selBlockName, selContent } =
		useSelectedChildBlock( clientId );
	const { updateBlockAttributes, replaceEdit } = unlock(
		useDispatch( blockEditorStore )
	);

	if ( ! selClientId ) {
		return null;
	}

	const onChange = ( value ) =>
		updateBlockAttributes( [ selClientId ], { content: value } );

	const onReplace = ( blocks, indexToSelect, initialPos ) =>
		replaceEdit( selClientId, blocks, indexToSelect, initialPos );

	return (
		<div className="block-placeholder">
			<RichText
				ref={ ref }
				identifier="content"
				clientId={ selClientId }
				blockName={ selBlockName }
				value={ selContent }
				onChange={ onChange }
				onReplace={ onReplace }
				__unstableAllowPrefixTransformations={
					selBlockName === 'core/paragraph'
				}
			/>
		</div>
	);
}

function FallbackEdit( { clientId } ) {
	return (
		<AsyncModeProvider value={ false }>
			<FallbackRichEdit clientId={ clientId } />
		</AsyncModeProvider>
	);
}

const Edit = ( props ) => {
	const { name } = props;
	const blockType = getBlockType( name );

	const Component = getBlockEdit( blockType );
	if ( ! Component ) {
		return null;
	}

	return <Component FallbackEdit={ FallbackEdit } { ...props } />;
};

const EditWithFilters = withFilters( 'editor.BlockEdit' )( Edit );

const EditWithGeneratedProps = ( props ) => {
	const { attributes = {}, name } = props;
	const blockType = getBlockType( name );
	const blockContext = useContext( BlockContext );

	// Assign context values using the block type's declared context needs.
	const context = useMemo( () => {
		return blockType && blockType.usesContext
			? Object.fromEntries(
					Object.entries( blockContext ).filter( ( [ key ] ) =>
						blockType.usesContext.includes( key )
					)
			  )
			: DEFAULT_BLOCK_CONTEXT;
	}, [ blockType, blockContext ] );

	if ( ! blockType ) {
		return null;
	}

	if ( blockType.apiVersion > 1 ) {
		return <EditWithFilters { ...props } context={ context } />;
	}

	// Generate a class name for the block's editable form.
	const generatedClassName = hasBlockSupport( blockType, 'className', true )
		? getBlockDefaultClassName( name )
		: null;
	const className = classnames(
		generatedClassName,
		attributes.className,
		props.className
	);

	return (
		<EditWithFilters
			{ ...props }
			context={ context }
			className={ className }
		/>
	);
};

export default EditWithGeneratedProps;
