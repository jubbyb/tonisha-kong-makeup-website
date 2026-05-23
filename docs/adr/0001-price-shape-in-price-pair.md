# Price shape is encoded in the (price, price_max) pair

Catalog services and artist offerings must express four price shapes — fixed, "from $X", a range, and "price on consult" — because the hair trade prices most work as ranges or open-ended minimums. Rather than add an explicit type/flag column, the shape is derived from two nullable columns: `price` NULL → consult; `price_max` NULL → "from $X"; `price_max == price` → fixed "$X"; `price_max > price` → range "$X – $Y".

Chosen over a simple `price_from` boolean because the pair also preserves the upper bound of true ranges, which the hair price list depends on. The cost is one non-obvious convention: a fixed price stores the same value in both columns. Existing fixed-price catalog rows are backfilled with `price_max = price` so they keep rendering as a flat price. The artist-override columns (`price_override`, `price_max_override`) follow the same convention, each `COALESCE`d independently with the catalog value.
