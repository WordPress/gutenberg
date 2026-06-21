/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo, useCallback } from '@wordpress/element';
import { GlobalStylesUI } from '@wordpress/global-styles-ui';
import { normalizeCSSClassName } from '@wordpress/global-styles-engine';
import { uploadMedia } from '@wordpress/media-utils';
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { GlobalStylesBlockLink } from './block-link';
import { useGlobalStyles } from './hooks';

/**
 * Hook to fetch server CSS and settings for BlockEditorProvider that are not Global Styles.
 *
 * @param {Object} settings The editor settings object.
 */
function useServerData( settings ) {
	const styles = settings?.styles;
	const __unstableResolvedAssets = settings?.__unstableResolvedAssets;
	const colors = settings?.colors;
	const gradients = settings?.gradients;
	const __experimentalDiscussionSettings =
		settings?.__experimentalDiscussionSettings;
	const fontLibraryEnabled = settings?.fontLibraryEnabled ?? true;

	const mediaUploadHandler = useSelect( ( select ) => {
		const { canUser } = select( coreStore );
		const canUserUploadMedia = canUser( 'create', {
			kind: 'postType',
			name: 'attachment',
		} );
		return canUserUploadMedia ? uploadMedia : undefined;
	}, [] );

	// Filter out global styles to get only server-provided styles
	const serverCSS = useMemo( () => {
		if ( ! styles ) {
			return [];
		}
		return styles.filter( ( style ) => ! style.isGlobalStyles );
	}, [ styles ] );

	// Create server settings object
	const serverSettings = useMemo( () => {
		return {
			__unstableResolvedAssets,
			settings: {
				color: {
					palette: {
						theme: colors ?? [],
					},
					gradients: {
						theme: gradients ?? [],
					},
					duotone: {
						theme: [],
					},
				},
			},
			__experimentalDiscussionSettings,
			mediaUpload: mediaUploadHandler,
		};
	}, [
		__unstableResolvedAssets,
		colors,
		gradients,
		__experimentalDiscussionSettings,
		mediaUploadHandler,
	] );

	return { serverCSS, serverSettings, fontLibraryEnabled };
}

function replaceClassNameToken( classNames, oldName, newName ) {
	const tokens = classNames?.split( /\s+/ ).filter( Boolean ) ?? [];

	if ( ! tokens.length ) {
		return classNames;
	}

	const oldClassName = normalizeCSSClassName( oldName );
	const newClassName = normalizeCSSClassName( newName );
	const nextTokens = [];
	for ( const token of tokens ) {
		const nextToken =
			normalizeCSSClassName( token ) === oldClassName
				? newClassName
				: token;

		if ( nextToken && ! nextTokens.includes( nextToken ) ) {
			nextTokens.push( nextToken );
		}
	}

	return nextTokens.length ? nextTokens.join( ' ' ) : undefined;
}

function getClassNameAttributeUpdates( blocks, oldName, newName ) {
	const updates = [];

	function visit( block ) {
		const className = block.attributes?.className;
		if ( block.clientId && typeof className === 'string' ) {
			const nextClassName = replaceClassNameToken(
				className,
				oldName,
				newName
			);

			if ( nextClassName !== className ) {
				updates.push( {
					clientId: block.clientId,
					className: nextClassName,
				} );
			}
		}

		block.innerBlocks?.forEach( visit );
	}

	blocks.forEach( visit );
	return updates;
}

export default function GlobalStylesUIWrapper( {
	path,
	onPathChange,
	settings,
} ) {
	const {
		user: userConfig,
		base: baseConfig,
		setUser: setUserConfig,
		isReady,
	} = useGlobalStyles();
	const { serverCSS, serverSettings, fontLibraryEnabled } =
		useServerData( settings );
	const contentBlocks = useSelect(
		( select ) => [
			...select( blockEditorStore ).getBlocks(),
			...select( editorStore ).getEditorBlocks(),
		],
		[]
	);
	const currentEntity = useSelect(
		( select ) => ( {
			id: select( editorStore ).getCurrentPostId(),
			type: select( editorStore ).getCurrentPostType(),
		} ),
		[]
	);
	const { selectBlock, updateBlockAttributes } =
		useDispatch( blockEditorStore );
	const onRenameContentClassName = useCallback(
		( oldName, newName ) => {
			const updates = getClassNameAttributeUpdates(
				contentBlocks,
				oldName,
				newName
			);

			updates.forEach( ( { clientId, className } ) => {
				updateBlockAttributes( clientId, { className } );
			} );
		},
		[ contentBlocks, updateBlockAttributes ]
	);
	const onNavigateToEntity = useCallback(
		( entity ) => {
			if (
				! settings?.onNavigateToEntityRecord ||
				! entity.id ||
				! entity.type
			) {
				return;
			}

			settings.onNavigateToEntityRecord( {
				postId: entity.id,
				postType: entity.type,
				selectedBlockPath: entity.blockPath,
			} );
		},
		[ settings?.onNavigateToEntityRecord ]
	);

	// Show loading state while data is being fetched
	if ( ! isReady ) {
		return null;
	}

	return (
		<>
			<GlobalStylesUI
				value={ userConfig }
				baseValue={ baseConfig || {} }
				onChange={ setUserConfig }
				path={ path }
				onPathChange={ onPathChange }
				fontLibraryEnabled={ fontLibraryEnabled }
				serverCSS={ serverCSS }
				serverSettings={ serverSettings }
				contentBlocks={ contentBlocks }
				currentEntity={ currentEntity }
				onSelectContentBlock={ selectBlock }
				onNavigateToEntity={ onNavigateToEntity }
				onRenameContentClassName={ onRenameContentClassName }
			/>
			<GlobalStylesBlockLink
				path={ path }
				onPathChange={ onPathChange }
			/>
		</>
	);
}

export { useGlobalStyles, useStyle, useSetting } from './hooks';
