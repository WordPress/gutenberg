/**
 * WordPress dependencies
 */
import {
	RawHTML,
	useEffect,
	useState,
	useMemo,
	useRef,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useServerSideRender } from './hook';
import type {
	PlaceholderProps,
	ErrorPlaceholderProps,
	LoadingPlaceholderProps,
	ServerSideRenderProps,
	ServerSideRenderWithPostIdProps,
} from './types';

const EMPTY_OBJECT = {};

function DefaultEmptyResponsePlaceholder( { className }: PlaceholderProps ) {
	return (
		<Placeholder className={ className }>
			{ __( 'Block rendered as empty.' ) }
		</Placeholder>
	);
}

function DefaultErrorResponsePlaceholder( {
	message,
	className,
}: ErrorPlaceholderProps ) {
	const errorMessage = sprintf(
		// translators: %s: error message describing the problem
		__( 'Error loading block: %s' ),
		message || __( 'Unknown error' )
	);
	return <Placeholder className={ className }>{ errorMessage }</Placeholder>;
}

function DefaultLoadingResponsePlaceholder( {
	children,
}: LoadingPlaceholderProps ) {
	const [ showLoader, setShowLoader ] = useState( false );

	useEffect( () => {
		// Schedule showing the Spinner after 1 second.
		const timeout = setTimeout( () => {
			setShowLoader( true );
		}, 1000 );
		return () => clearTimeout( timeout );
	}, [] );

	return (
		<div style={ { position: 'relative' } }>
			{ showLoader && (
				<div
					style={ {
						position: 'absolute',
						top: '50%',
						left: '50%',
						marginTop: '-9px',
						marginLeft: '-9px',
					} }
				>
					<Spinner />
				</div>
			) }
			<div style={ { opacity: showLoader ? '0.3' : 1 } }>
				{ children }
			</div>
		</div>
	);
}

export function ServerSideRender( props: ServerSideRenderProps ) {
	const prevContentRef = useRef( '' );
	const {
		className,
		EmptyResponsePlaceholder = DefaultEmptyResponsePlaceholder,
		ErrorResponsePlaceholder = DefaultErrorResponsePlaceholder,
		LoadingResponsePlaceholder = DefaultLoadingResponsePlaceholder,
		...restProps
	} = props;

	const { content, status, error } = useServerSideRender( restProps );

	// Store the previous successful HTML response to show while loading.
	useEffect( () => {
		if ( content ) {
			prevContentRef.current = content;
		}
	}, [ content ] );

	if ( status === 'loading' ) {
		return (
			<LoadingResponsePlaceholder { ...props }>
				{ /* eslint-disable-next-line react-hooks/refs */ }
				{ !! prevContentRef.current && (
					<RawHTML className={ className }>
						{
							// eslint-disable-next-line react-hooks/refs
							prevContentRef.current
						}
					</RawHTML>
				) }
			</LoadingResponsePlaceholder>
		);
	}

	if ( status === 'success' && ! content ) {
		return <EmptyResponsePlaceholder { ...props } />;
	}

	if ( status === 'error' ) {
		return <ErrorResponsePlaceholder message={ error } { ...props } />;
	}

	return <RawHTML className={ className }>{ content || '' }</RawHTML>;
}

/**
 * A component that renders server-side content for blocks.
 *
 * Note: URL query will include the current post ID when applicable.
 * This is useful for blocks that depend on the context of the current post for rendering.
 *
 * @example
 * ```jsx
 * import { ServerSideRender } from '@wordpress/server-side-render';
 * // Legacy import for WordPress 6.8 and earlier
 * // import { default as ServerSideRender } from '@wordpress/server-side-render';
 *
 * function Example() {
 *   return (
 *     <ServerSideRender
 *       block="core/archives"
 *       attributes={ { showPostCounts: true } }
 *       urlQueryArgs={ { customArg: 'value' } }
 *       className="custom-class"
 *     />
 *   );
 * }
 * ```
 *
 * @param props              Component props.
 * @param props.urlQueryArgs Additional query arguments to append to the request URL.
 * @return The rendered server-side content.
 */
export function ServerSideRenderWithPostId( {
	urlQueryArgs = EMPTY_OBJECT,
	...props
}: ServerSideRenderWithPostIdProps ) {
	const currentPostId = useSelect( ( select ) => {
		// FIXME: @wordpress/server-side-render should not depend on @wordpress/editor.
		// It is used by blocks that can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editorStore = select( 'core/editor' );
		// @ts-expect-error - editorStore is not typed in @wordpress/data
		const postId = editorStore?.getCurrentPostId?.();

		// For templates and template parts we use a custom ID format.
		// Since they aren't real posts, we don't want to use their ID
		// for server-side rendering. Since they use a string based ID,
		// we can assume real post IDs are numbers.
		return postId && typeof postId === 'number' ? postId : null;
	}, [] );

	const newUrlQueryArgs = useMemo( () => {
		if ( ! currentPostId ) {
			return urlQueryArgs;
		}
		return {
			post_id: currentPostId,
			...urlQueryArgs,
		};
	}, [ currentPostId, urlQueryArgs ] );

	return <ServerSideRender urlQueryArgs={ newUrlQueryArgs } { ...props } />;
}
