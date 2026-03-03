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
import { plus } from '@wordpress/icons';

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
				size="small"
				ref={ ref }
				className="wp-block-page-list__appender-toggle"
				icon={ plus }
				onClick={ () => setShowCreator( true ) }
				label={ __( 'Add page' ) }
				showTooltip
			/>
			{ showCreator && (
				<Popover
					anchor={ ref.current }
					placement="bottom-start"
					shift
					onClose={ () => setShowCreator( false ) }
				>
					<LinkUIPageCreator
						postType="page"
						onClose={ () => setShowCreator( false ) }
						onPageCreated={ () => setShowCreator( false ) }
						menuOrder={ contextData?.menuOrder }
					/>
				</Popover>
			) }
		</>
	);
}
