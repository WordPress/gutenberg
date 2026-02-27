/**
 * WordPress dependencies
 */
import {
	createContext,
	useContext,
	useState,
	useRef,
} from '@wordpress/element';
import { Button, Popover } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plus } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import { LinkUIPageCreator } from '../navigation-link/link-ui/page-creator';

export const PageCreatorContext = createContext( null );

export default function PageCreatorAppender() {
	const [ showCreator, setShowCreator ] = useState( false );
	const ref = useRef();
	const contextData = useContext( PageCreatorContext );

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
						onClose={ () => setShowCreator( false ) }
						onPageCreated={ () => setShowCreator( false ) }
						menuOrder={ contextData?.menuOrder }
						parent={ contextData?.parent }
					/>
				</Popover>
			) }
		</>
	);
}
