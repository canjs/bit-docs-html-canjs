# Sidebar Docs

## Architecture

Most of the logic for the sidebar is broken up into three files:

- [page-model.js](page-model.js) represents any documented module/page/etc.
- [sidebar.viewmodel.js](sidebar.viewmodel.js) has everything else that’s needed for the template
- [sidebar.events.js](sidebar.events.js) handles button & links clicks and the animations

### Page model

In addition to storing the data about each module/page/etc., the page model
is responsible for some stateful information about how the page is being
displayed in the template:

- `parentPage` is set by the view-model when the page is initialized
- `unsortedChildren` contains _all_ the children before they’re sorted
- `sortedChildren` contains _all_ the children after sorting
- `childrenInCoreCollection` contains only the children that are part of `can-core`
- `isCollapsible` is only true for pages like Observables, Views, etc.
- `isCollapsed` uses local storage to track whether the user has collapsed a section
- `visibleChildren` returns either `childrenInCoreCollection` or `sortedChildren`, depending on `isCollapsed`

Additionally, the `collapse` method is used to update local storage when
`isCollapsed` is changed by the user. It should only be called when
initiated by the user; any other (programatic) changes to `isCollapsed`
should not be persisted to local storage.

## Debugging

The demo files make it easier to debug issues without having to rebuild the
entire site. For example, you can test how the sidebar starts with an
initial page by changing `selectedPageName: 'canjs'` in [demo.js](demo.js).
