/**
 * styled-griddie, while working for Emotions' plugins programaittically,
 * has some inscruitible type issues due to its dependency on styled-components
 * (it was originally intended as a styled-components plugin).
 *
 * I wasn't able to figure out how to fix the type errors in StyledComponent's type files
 * so overriding was the easiest thing to do. Also, we're dropping IE11 support soon so
 * this will go away in the near future anyway, so it wasn't worth the hassel long-term either.
 */
declare module 'styled-griddie';
