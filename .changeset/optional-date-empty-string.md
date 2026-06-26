---
'@davepi/ui-core': patch
---

Fix `zodFromDescribe` rejecting empty optional Date fields. Optional `Date` fields now treat `''` and `null` as "no date set" (coerced to `undefined`) instead of failing with an "invalid date" error.
