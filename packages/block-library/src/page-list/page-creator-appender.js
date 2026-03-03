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
		<div className="block-list-appender wp-block">
			<Button
				__next40pxDefaultSize
				ref={ ref }
				className="block-list-appender__toggle"
				style={ { display: 'flex' } }
				icon={ plus }
				onClick={ () => setShowCreator( true ) }
				label={ __( 'Add page' ) }
				showTooltip
			/>
			{ showCreator && (
				<Popover anchor={ ref.current } placement="bottom-start" shift>
					<LinkUIPageCreator
						postType="page"
						onClose={ () => setShowCreator( false ) }
						onPageCreated={ () => setShowCreator( false ) }
						menuOrder={ contextData?.menuOrder }
					/>
				</Popover>
			) }
		</div>
	);
}
