/**
 * WordPress dependencies
 */
import { isRTL } from '@wordpress/i18n';
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalNavigatorProvider as NavigatorProvider,
	__experimentalNavigatorScreen as NavigatorScreen,
	__experimentalNavigatorButton as NavigatorButton,
	privateApis as componentsPrivateApis,
} from '@wordpress/components';
import { Icon, chevronRight, chevronLeft } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const {
	CompositeV2: Composite,
	CompositeItemV2: CompositeItem,
	useCompositeStoreV2: useCompositeStore,
} = unlock( componentsPrivateApis );

export default function InserterContentNavigator( { categories, children } ) {
	const compositeStore = useCompositeStore( { orientation: 'vertical' } );

	return (
		<NavigatorProvider
			initialPath="/"
			className="block-editor-inserter__mobile-tab-navigation"
		>
			<NavigatorScreen path="/">
				<Composite
					store={ compositeStore }
					role="tree"
					aria-label={ 'Categories' }
				>
					<VStack>
						{ categories.map( ( category ) => (
							<CompositeItem
								key={ category.name }
								render={
									<NavigatorButton
										path={ `/category/${ category.name }` }
										role="treeitem"
									>
										<HStack>
											<span>{ category.label }</span>
											<Icon
												icon={
													isRTL()
														? chevronLeft
														: chevronRight
												}
											/>
										</HStack>
									</NavigatorButton>
								}
							/>
						) ) }
					</VStack>
				</Composite>
			</NavigatorScreen>
			{ categories.map( ( category ) => (
				<NavigatorScreen
					key={ category.name }
					path={ `/category/${ category.name }` }
				>
					{ children( category ) }
				</NavigatorScreen>
			) ) }
		</NavigatorProvider>
	);
}
