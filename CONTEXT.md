# StyleJA

Multi-vendor marketplace where artists across six beauty/style trades publish services and take bookings. This glossary fixes the language used across the codebase.

## Language

### Services & pricing

**Catalog Service**:
A service definition in the shared, admin-managed catalog (`catalog_services`), carrying a default price, default currency, and duration. Visible to every artist in its trade.
_Avoid_: "service" (ambiguous — see Flagged ambiguities)

**Offering**:
An artist's adoption of a **Catalog Service** (`artist_services` row). May carry a price override and a currency override.
_Avoid_: "artist service", "my service"

**Effective Price**:
The price a client actually sees for an **Offering** — `COALESCE(price_override, catalog price)`.

**Effective Currency**:
The currency a client actually sees for an **Offering** — `COALESCE(currency_override, catalog currency)`. One of `JMD` or `USD`.

**Price shape**:
How a service's price is rendered, derived from `(price, price_max)`. `price` NULL → **Consult Price** ("Price on consult"). `price_max` NULL → **From Price** ("from $X"). `price_max == price` → **Fixed Price** ("$X"). `price_max > price` → **Price Range** ("$X – $Y"). The same rule applies to a catalog default and to an **Offering**'s effective values.

**Catalog Category** / **Catalog Subcategory**:
The two grouping levels above a **Catalog Service** (`service_categories` → `service_subcategories`). A Category is tied to one or more **Trades**.

**Trade**:
One of the six marketplace verticals — Makeup, Hair, Nails, Barber, Stylist, Tailoring (`industries`).
_Avoid_: "industry" in user-facing copy (table is named `industries`).

## Relationships

- A **Catalog Service** belongs to one **Catalog Subcategory**, which belongs to one **Catalog Category**, which belongs to one or more **Trades**.
- An **Offering** links one artist to one **Catalog Service**.
- **Effective Price** and **Effective Currency** are computed per **Offering**, never stored on a booking (yet).

## Example dialogue

> **Dev:** "If two hairstylists both offer Box Braids, do they share a price?"
> **Domain expert:** "No — Box Braids is one **Catalog Service**. Each hairstylist has her own **Offering** of it, and each can override the price and the currency. The catalog default is just the starting point."

## Flagged ambiguities

- "service" is overloaded: the legacy flat `services` table (homepage only), a **Catalog Service**, an **Offering**, and `bookings.service` (a free-text name). Prefer the precise term; treat `catalog_services` as the source of truth for booking flows.
