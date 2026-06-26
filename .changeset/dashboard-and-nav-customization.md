---
'@davepi/ui-core': minor
---

Add navigation and dashboard customization knobs to consumer config:

- `ResourceConfig.hidden` — drop a resource from the sidebar and dashboard cards without affecting its routes (cosmetic decluttering, not access control — use `permissions`/backend ACL for that).
- `ResourceConfig.icon` is now consumed by the app shell: accepts a [lucide](https://lucide.dev) icon name (`'users'`, `'shopping-cart'`, `'ShoppingCart'`) or any literal string (e.g. an emoji), rendered beside the label in the sidebar and on dashboard cards.
- `DavepiUiConfig.dashboard` (`title`, `subtitle`, `showResourceCards`, `resourceCards`) — customize the home page heading and which resource cards render, or blank it out to drop in your own widgets.
- `DescribeField.computed` — typed flag for server-derived fields. Like `stamped`, the UI hides these from create/edit forms and treats them as read-only.
