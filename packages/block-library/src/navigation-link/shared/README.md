# Navigation Blocks Shared Components

This directory contains shared components and utilities used by both the Navigation Link and Navigation Submenu blocks to reduce code duplication and ensure consistent behavior.

## Purpose

The Navigation Link and Navigation Submenu blocks share significant functionality, particularly in their inspector controls (ToolsPanel). This shared directory was created to:

-   **Reduce code duplication** - Eliminate identical code between the two blocks
-   **Ensure consistency** - Both blocks now use the same components, preventing behavioral differences
-   **Reduce maintenance burden** - Changes to shared functionality only need to be made in one place
-   **Minimize bugs** - Less duplicated code means fewer places for bugs to hide
-   **Improve testability** - Shared components can be tested once and reused

## Current Shared Components

-   **`Controls`** - Inspector controls component providing the ToolsPanel interface for both blocks

## Future Direction

While this shared directory provides immediate benefits for reducing duplication, the long-term vision is to refactor towards a **unified Navigation Item block** that can behave differently based on context (link vs submenu). This would:

-   Eliminate the need for separate Navigation Link and Navigation Submenu blocks
-   Provide a single, more maintainable codebase
-   Allow for more flexible navigation item types
-   Simplify the user experience

However, this refactoring is beyond the current scope and would require significant architectural changes. For now, this shared directory provides a practical solution that:

-   Maintains backward compatibility
-   Reduces immediate technical debt
-   Prepares the foundation for future unification
-   Supports the integration of new features like Dynamic URL functionality

## Testing

All shared components include comprehensive tests in the `test/` directory. The tests use pure mocking strategies to ensure isolated, reliable testing of component behavior.

## Contributing

When adding new shared functionality:

1. Place shared components in this directory
2. Export them from `index.js`
3. Add comprehensive tests
4. Update both Navigation Link and Navigation Submenu blocks to use the shared component
5. Remove any duplicated code from the individual blocks
