# St Catherine's Group — Site Guidelines

## Imports

Always use the wildcard import for shared service components:

```ts
import * as ServiceComponent from "../../components/Services";
```

Never import `Hero`, `Testimonials`, or other shared components individually. This applies to both `/pages/services/` and `/pages/nurses/` pages.

## Component Names

Use the `Services`-prefixed names exported from the index:

| Component              | Usage                |
| ---------------------- | -------------------- |
| `ServicesHero`         | Page hero section    |
| `ServicesTestimonials` | Testimonials section |

## Tailwind Conventions

- Use `shrink-0` not `flex-shrink-0`
- Use `grow` not `flex-grow`
