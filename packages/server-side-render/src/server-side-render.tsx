/**
 * External dependencies
 */
import type { ComponentType, ReactNode } from 'react';

/**
 * WordPress dependencies
 */
import {
	RawHTML,
	useEffect,
	useState,
	useRef,
	useMemo,
} from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Placeholder, Spinner } from '@wordpress/components';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { useServerSideRender } from './hook';
import type { UseServerSideRenderArgs } from './hook';

const EMPTY_OBJECT = {};

interface PlaceholderProps {
	className?: string;
}

interface ErrorPlaceholderProps extends PlaceholderProps {
	message?: string;
}

interface LoadingPlaceholderProps {
	children?: ReactNode;
}

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
		message || 'Unknown error'
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

interface ServerSideRenderProps extends UseServerSideRenderArgs {
	className?: string;
	EmptyResponsePlaceholder?: ComponentType< PlaceholderProps >;
	ErrorResponsePlaceholder?: ComponentType< ErrorPlaceholderProps >;
	LoadingResponsePlaceholder?: ComponentType< LoadingPlaceholderProps >;
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
				{ !! prevContentRef.current && (
					<RawHTML className={ className }>
						{ prevContentRef.current }
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

interface ServerSideRenderWithPostIdProps
	extends Omit< ServerSideRenderProps, 'urlQueryArgs' > {
	urlQueryArgs?: Record< string, unknown >;
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
 * @param {Object}   props                                    Component props.
 * @param {string}   props.block                              The identifier of the block to be serverside rendered.
 * @param {Object}   props.attributes                         The block attributes to be sent to the server for rendering.
 * @param {string}   [props.className]                        Additional classes to apply to the wrapper element.
 * @param {string}   [props.httpMethod='GET']                 The HTTP method to use ('GET' or 'POST'). Default is 'GET'
 * @param {Object}   [props.urlQueryArgs]                     Additional query arguments to append to the request URL.
 * @param {boolean}  [props.skipBlockSupportAttributes=false] Whether to remove block support attributes before sending.
 * @param {Function} [props.EmptyResponsePlaceholder]         Component rendered when the API response is empty.
 * @param {Function} [props.ErrorResponsePlaceholder]         Component rendered when the API response is an error.
 * @param {Function} [props.LoadingResponsePlaceholder]       Component rendered while the API request is loading.
 *
 * @return {React.JSX.Element} The rendered server-side content.
 */
export function ServerSideRenderWithPostId( {
	urlQueryArgs = EMPTY_OBJECT,
	...props
}: ServerSideRenderWithPostIdProps ) {
	const currentPostId = useSelect( ( select ) => {
		// FIXME: @wordpress/server-side-render should not depend on @wordpress/editor.
		// It is used by blocks that can be loaded into a *non-post* block editor.
		// eslint-disable-next-line @wordpress/data-no-store-string-literals
		const editorStore = select( 'core/editor' ) as
			| {
					getCurrentPostId?: () => number | string | null;
			  }
			| undefined;
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
