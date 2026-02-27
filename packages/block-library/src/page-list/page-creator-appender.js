/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useMemo,
	useRef,
} from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';
import { useEntityRecords } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { LinkUIPageCreator } from '../navigation-link/link-ui/page-creator';

const MAX_PAGE_COUNT = 100;

export const PageCreatorContext = createContext( null );

export default function PageCreatorAppender() {
	const [ showCreator, setShowCreator ] = useState( false );
	const ref = useRef();
	const contextData = useContext( PageCreatorContext );

	const { records: pages } = useEntityRecords( 'postType', 'page', {
		per_page: MAX_PAGE_COUNT,
		_fields: [ 'id', 'link', 'menu_order', 'parent', 'title', 'type' ],
		orderby: 'menu_order',
		order: 'asc',
	} );

	const additionalData = useMemo( () => {
		// If context provides data (e.g., from Page List with parentPageID),
		// use it directly.
		if ( contextData?.additionalData ) {
			return contextData.additionalData;
		}
		// Otherwise compute menu_order from pages.
		const maxMenuOrder =
			pages?.reduce(
				( max, page ) => Math.max( max, page.menu_order ),
				0
			) ?? 0;
		return { menu_order: maxMenuOrder + 1 };
	}, [ contextData, pages ] );

	return (
		<>
			<Button
				__next40pxDefaultSize
				ref={ ref }
				className="block-editor-button-block-appender block-list-appender__toggle"
				onClick={ () => setShowCreator( true ) }
				label={ __( 'Add page' ) }
				showTooltip
			>
				<Icon icon={ plus } />
			</Button>
			{ showCreator && (
				<Popover anchor={ ref.current } placement="bottom-start" shift>
					<LinkUIPageCreator
						postType="page"
						onBack={ () => setShowCreator( false ) }
						onPageCreated={ () => setShowCreator( false ) }
						additionalData={ additionalData }
					/>
				</Popover>
			) }
		</>
	);
}
