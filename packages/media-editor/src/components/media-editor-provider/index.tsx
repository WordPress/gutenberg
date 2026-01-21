/**
 * WordPress dependencies
 */
import { createContext, useContext, useState } from '@wordpress/element';
import type { Field } from '@wordpress/dataviews';
import type { ReactNode } from 'react';
import { ImageCropperProvider } from '@wordpress/image-cropper';

/**
 * Media object from WordPress REST API.
 */
export interface Media {
	id?: number;
	source_url?: string;
	mime_type?: string;
	alt_text?: string;
	title?: string | { rendered?: string; raw?: string };
	caption?: string | { rendered?: string; raw?: string };
	description?: string | { rendered?: string; raw?: string };
	[ key: string ]: any;
}

/**
 * Context value for MediaEditor.
 */
export interface MediaEditorContextValue {
	media?: Media;
	onChange?: ( updates: Partial< Media > ) => void;
	fields: Field< Media >[];
	isEditingImage: boolean;
	setIsEditingImage: ( editing: boolean ) => void;
	onSaveImage?: ( media: Media ) => Promise< void >;
}

/**
 * Props for MediaEditorProvider.
 */
export interface MediaEditorProviderProps {
	/** The media object to edit. */
	value?: Media;
	/**
	 * Callback when media is updated.
	 *
	 * Optional - if not provided, the MediaEditor can be used in a read-only mode,
	 * useful for preview-only scenarios.
	 */
	onChange?: ( updates: Partial< Media > ) => void;
	/**
	 * Callback when an edited image is saved.
	 *
	 * Optional - called after image editing is complete, useful for server persistence.
	 */
	onSaveImage?: ( media: Media ) => Promise< void >;
	/** Configuration settings for the media editor. */
	settings?: {
		fields?: Field< Media >[];
	};
	/** Child components. */
	children: ReactNode;
}

const MediaEditorContext = createContext< MediaEditorContextValue | undefined >(
	undefined
);

export function MediaEditorProvider( {
	value,
	onChange,
	onSaveImage,
	settings = {},
	children,
}: MediaEditorProviderProps ) {
	const [ isEditingImage, setIsEditingImage ] = useState( false );

	const contextValue: MediaEditorContextValue = {
		media: value,
		onChange,
		fields: settings.fields || [],
		isEditingImage,
		setIsEditingImage,
		onSaveImage,
	};

	// Detect if this is an image media type
	const isImage = value?.mime_type?.split( '/' )[ 0 ] === 'image';

	return (
		<MediaEditorContext.Provider value={ contextValue }>
			{ isImage ? (
				<ImageCropperProvider>{ children }</ImageCropperProvider>
			) : (
				children
			) }
		</MediaEditorContext.Provider>
	);
}

/**
 * Hook to access the MediaEditor context.
 *
 * Must be used within a MediaEditorProvider component.
 *
 * @return MediaEditorContextValue value with media, onChange, and fields, etc.
 */
export function useMediaEditorContext(): MediaEditorContextValue {
	const context = useContext( MediaEditorContext );
	if ( ! context ) {
		throw new Error(
			'useMediaEditorContext must be used within MediaEditorProvider'
		);
	}
	return context;
}
