/**
 * Props for the PluginErrorBoundary component.
 */
export interface PluginErrorBoundaryProps {
	/**
	 * The name of the plugin that may encounter an error.
	 */
	name: string;
	/**
	 * The child components to render.
	 */
	children: React.ReactNode;
	/**
	 * Callback function called when an error occurs.
	 */
	onError?: ( name: string, error: Error ) => void;
}

/**
 * State for the PluginErrorBoundary component.
 */
export interface PluginErrorBoundaryState {
	hasError: boolean;
}
