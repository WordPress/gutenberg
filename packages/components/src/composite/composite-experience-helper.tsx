/**
 * WordPress dependencies
 */
import {
	createPortal,
	useEffect,
	useId,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import {
	SVG,
	Defs,
	LinearGradient,
	Stop,
	G,
	Path,
	Rect,
} from '@wordpress/primitives';
import { __, isRTL } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';

/**
 * Internal dependencies
 */
import { View } from '../view';

const DEFAULT_MESSAGE = __( 'Use arrow keys to navigate' );

export interface Props extends React.ComponentProps< 'div' > {
	audible?: boolean;
	visible?: boolean;
	message?: string;
}

interface RenderProps extends Props {
	contentRef: React.RefObject< HTMLElement | undefined >;
	helperIsActive: boolean;
	helperIsVisible: boolean;
}

interface OverlayProps {
	id: string;
}

const HelperOverlay = ( { id }: OverlayProps ) => {
	const rtl = isRTL();
	const gradientId = `${ id }-gradient`;
	const shadowId = `${ id }-shadow`;

	const style: React.CSSProperties = useMemo(
		() => ( {
			pointerEvents: 'none',
			position: 'fixed',
			bottom: '2em',
			[ rtl ? 'right' : 'left' ]: '2em',
		} ),
		[ rtl ]
	);

	return useMemo(
		() => (
			<SVG
				id={ id }
				width="90"
				height="60"
				viewBox="0 0 90 60"
				style={ style }
			>
				<Defs>
					<LinearGradient
						id={ gradientId }
						x1="0"
						x2="0"
						y1="0"
						y2="1"
					>
						<Stop offset="0%" stopColor="#FFF" />
						<Stop offset="10%" stopColor="#AAA" />
						<Stop offset="50%" stopColor="#CCC" />
						<Stop offset="100%" stopColor="#FFF" />
					</LinearGradient>
					<filter id={ shadowId }>
						<feDropShadow
							dx="0"
							dy="1"
							stdDeviation="0.5"
							floodColor="#FFF"
						/>
					</filter>
				</Defs>
				<G
					stroke="#000"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<G fill={ `url(#${ gradientId })` }>
						<Rect
							width="25"
							height="25"
							x="32.5"
							y="2.5"
							rx="5"
							ry="5"
						/>
						<Rect
							width="25"
							height="25"
							x="2.5"
							y="32.5"
							rx="5"
							ry="5"
						/>
						<Rect
							width="25"
							height="25"
							x="32.5"
							y="32.5"
							rx="5"
							ry="5"
						/>
						<Rect
							width="25"
							height="25"
							x="62.5"
							y="32.5"
							rx="5"
							ry="5"
						/>
					</G>
					<G fill="transparent" filter={ `url(#${ shadowId })` }>
						<Path d="M41 16 l4 -4 4 4" />
						<Path d="M16 41 l-4 4 4 4" />
						<Path d="M41 44 l4 4 4 -4" />
						<Path d="M74 41 l4 4 -4 4" />
					</G>
				</G>
			</SVG>
		),
		[ style, id, gradientId, shadowId ]
	);
};

export function useCompositeExperienceHelper( {
	audible = true,
	visible = true,
	message = DEFAULT_MESSAGE,
	...props
}: Props ): RenderProps {
	const [ helperIsActive, setHelperIsActive ] = useState( false );
	const [ contentNode, setContentNode ] = useState<
		HTMLElement | undefined
	>();
	const contentRef = useRef< HTMLElement | undefined >(
		Object.create( null )
	);
	Object.defineProperty( contentRef, 'current', {
		enumerable: true,
		configurable: true,
		get: () => contentNode,
		set: setContentNode,
	} );
	const isMouseAction = useRef( false );

	useEffect( () => {
		if ( audible && helperIsActive ) {
			speak( message );
		}
	}, [ audible, helperIsActive, message ] );

	return {
		...props,
		onMouseDown: ( event ) => {
			isMouseAction.current = true;
			setHelperIsActive( false );
			props.onMouseDown?.( event );
		},
		onMouseUp: ( event ) => {
			isMouseAction.current = false;
			props.onMouseUp?.( event );
		},
		onFocus: ( event ) => {
			if ( ! isMouseAction.current ) {
				setHelperIsActive( true );
			}
			props.onFocus?.( event );
		},
		onBlur: ( event ) => {
			const { relatedTarget } = event;
			if ( ! contentNode?.contains( relatedTarget ) ) {
				setHelperIsActive( false );
			}
			props.onBlur?.( event );
		},
		contentRef,
		helperIsActive,
		helperIsVisible: helperIsActive && visible,
	};
}

const CompositeExperienceHelper = ( props: Props ) => {
	const overlayId = useId();
	const { contentRef, helperIsActive, helperIsVisible, ...viewProps } =
		useCompositeExperienceHelper( props );

	return (
		<>
			<View { ...viewProps } ref={ contentRef } />
			{ contentRef.current && helperIsVisible
				? createPortal(
						<HelperOverlay id={ overlayId } />,
						contentRef.current.ownerDocument.body,
						'composite-experience-helper-overlay'
				  )
				: null }
		</>
	);
};

export default CompositeExperienceHelper;
