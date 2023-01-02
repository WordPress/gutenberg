/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalUseNavigator as useNavigator,
} from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';

const NavigationInspector = ( {
	selectedBlockClientId,
	blockName,
	blockInspectorSingleBlock,
} ) => {
	const { parentNavBlock, childNavBlocks } = useSelect(
		( select ) => {
			const {
				getBlockParentsByBlockName,
				getClientIdsOfDescendants,
				getBlock,
			} = select( blockEditorStore );

			let navBlockClientId;

			if ( blockName === 'core/navigation' ) {
				navBlockClientId = selectedBlockClientId;
			} else if (
				blockName === 'core/navigation-link' ||
				blockName === 'core/navigation-submenu'
			) {
				navBlockClientId = getBlockParentsByBlockName(
					selectedBlockClientId,
					'core/navigation',
					true
				)[ 0 ];
			}

			const _childClientIds = getClientIdsOfDescendants( [
				navBlockClientId,
			] );

			return {
				parentNavBlock: getBlock( navBlockClientId ),
				childNavBlocks: _childClientIds.map( ( id ) => {
					return getBlock( id );
				} ),
			};
		},
		[ selectedBlockClientId, blockName ]
	);

	return (
		<NavigatorProvider
			initialPath={ selectedBlockClientId }
			initialAnimationOverride="disableAnimation"
		>
			<NavigationInspectorScreens
				selectedBlockClientId={ selectedBlockClientId }
				parentNavBlock={ parentNavBlock }
				childNavBlocks={ childNavBlocks }
				blockInspectorSingleBlock={ blockInspectorSingleBlock }
			/>
		</NavigatorProvider>
	);
};

const NavigationInspectorScreens = ( {
	selectedBlockClientId,
	parentNavBlock,
	childNavBlocks,
	blockInspectorSingleBlock: BlockInspectorSingleBlock,
} ) => {
	const { goTo } = useNavigator();
	const previousDepth = useRef( -1 );
	const { navBlockTree } = useSelect(
		( select ) => {
			const { __unstableGetClientIdWithClientIdsTree } =
				select( blockEditorStore );

			return {
				navBlockTree: __unstableGetClientIdWithClientIdsTree(
					parentNavBlock.clientId
				),
			};
		},
		[ selectedBlockClientId ]
	);

	const getBlockDepth = ( targetClientId, currentDepth, rootBlock ) => {
		if ( targetClientId === rootBlock.clientId ) {
			return currentDepth;
		}
		for ( let i = 0; i < rootBlock.innerBlocks.length; i++ ) {
			const newDepth = getBlockDepth(
				targetClientId,
				currentDepth + 1,
				rootBlock.innerBlocks[ i ]
			);
			if ( newDepth > currentDepth ) {
				return newDepth;
			}
		}
	};

	useEffect( () => {
		const currentDepth = getBlockDepth(
			selectedBlockClientId,
			0,
			navBlockTree
		);
		let animationOverride = 'disableAnimation';
		if ( currentDepth === 0 && previousDepth.current > 0 ) {
			animationOverride = 'forceForward';
		} else if ( currentDepth > 0 && previousDepth.current === 0 ) {
			animationOverride = 'forceBackward';
		}
		previousDepth.current = currentDepth;
		goTo( selectedBlockClientId, animationOverride );
	}, [ selectedBlockClientId ] );

	return (
		<>
			<NavigatorScreen path={ parentNavBlock.clientId }>
				<BlockInspectorSingleBlock
					clientId={ parentNavBlock.clientId }
					blockName={ parentNavBlock.name }
				/>
			</NavigatorScreen>
			{ childNavBlocks.map( ( childNavBlock ) => {
				return (
					<NavigatorScreen
						path={ childNavBlock.clientId }
						key={ childNavBlock.clientId }
					>
						<BlockInspectorSingleBlock
							clientId={ childNavBlock.clientId }
							blockName={ childNavBlock.name }
						/>
					</NavigatorScreen>
				);
			} ) }
		</>
	);
};

export default NavigationInspector;
