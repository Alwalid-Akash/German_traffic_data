# Answer Justifications

This document explains how the current answers are produced from the normalized database.
The answers below reflect the current imported dataset snapshot from the latest ETL run.
They are not hardcoded in the application.

## Main Schema Map

| Table | What it stores |
| --- | --- |
| `regions` | official AGS region hierarchy from GV-ISys |
| `accidents` | event-level Unfallatlas accident rows |
| `indicators` | indicator definitions and codes |
| `indicator_values` | Regionalatlas regional statistics and derived rates |
| `import_runs` | ETL run history |
| `source_files` | source file provenance |

## 1. Earliest accident year in the complete dataset

| Item | Value |
| --- | --- |
| Answer | `2016` |
| Schema used | `accidents` |
| Query shape | `SELECT MIN(year) FROM accidents;` |
| Data resource | Unfallatlas |
| Explanation | The accident table stores one row per accident. The earliest year is simply the smallest `year` value present in the table. |

## 2. Personal injury accidents in Saxony in 2023

| Item | Value |
| --- | --- |
| Answer | `12513` |
| Schema used | `accidents`, `regions` |
| Query shape | `COUNT(*)` with `a.year = 2023`, `a.is_personal_injury = true`, `LEFT(r.ags, 2) = '14'` |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | Unfallatlas provides the accident records, while GV-ISys provides the official state key. Saxony is AGS prefix `14`, so the query filters all accident rows in that state for 2023 where personal injury is true. |

## 3. From which year onwards is data available for North Rhine-Westphalia?

| Item | Value |
| --- | --- |
| Answer | `2019` |
| Schema used | `accidents`, `regions` |
| Query shape | `SELECT MIN(a.year)` with `LEFT(r.ags, 2) = '05'` |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | The earliest accident year found for state AGS `05` is 2019. That means the normalized accident dataset has coverage for North Rhine-Westphalia starting in 2019. |

## 4. From which year onwards is data available for Mecklenburg-Western Pomerania?

| Item | Value |
| --- | --- |
| Answer | `2020` |
| Schema used | `accidents`, `regions` |
| Query shape | `SELECT MIN(a.year)` with `LEFT(r.ags, 2) = '13'` |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | The earliest accident year found for state AGS `13` is 2020. The state key comes from GV-ISys, and the years come from Unfallatlas accidents. |

## 5. Pedestrian accidents in Berlin in 2023

| Item | Value |
| --- | --- |
| Answer | `1794` |
| Schema used | `accidents`, `regions` |
| Query shape | `COUNT(*)` with `a.year = 2023`, `a.is_pedestrian = true`, `LEFT(r.ags, 2) = '11'` |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | Berlin is state AGS `11`. The accident table stores the pedestrian flag, so the count is the number of 2023 accident rows in Berlin marked as pedestrian-related. |

## 6. Traffic accidents per 100,000 registered passenger cars

| Item | Value |
| --- | --- |
| Answer | Example top row: Lübeck `1151.46` |
| Schema used | `accidents`, `regions`, `indicators`, `indicator_values` |
| Query shape | `accident_count / passenger_cars * 100000` |
| Data resource | Unfallatlas + Regionalatlas |
| Explanation | This is a cross-source question. Accident counts come from Unfallatlas. Passenger-car stock comes from Regionalatlas. The API also reports `accident_year` and `passenger_car_year` because the official tables do not use the same reporting date in the current download. |

### Cross-source note

Current source periods in the downloaded files:

- accident numerator table: `2023`
- passenger-car denominator table: `01.01.2025`

So the result is transparent about which years were actually combined.

## 7. Top five districts with the highest fatal accidents in 2024

| Item | Value |
| --- | --- |
| Answer | Berlin `48`, Hamburg `36`, Region Hannover `28`, Osnabrück `26`, Kleve `24` |
| Schema used | `accidents`, `regions` |
| Query shape | `COUNT(*)` with `a.is_fatal = true`, grouped by district |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | Fatal accidents are stored in the event table. The district name is resolved through the region hierarchy so each accident is counted in the correct district. |

## 8. Bicycle accidents in Dresden in 2024

| Item | Value |
| --- | --- |
| Answer | `1225` |
| Schema used | `accidents`, `regions` |
| Query shape | `COUNT(*)` with `a.year = 2024`, `a.is_bicycle = true`, region name contains Dresden |
| Data resource | Unfallatlas + GV-ISys |
| Explanation | Bicycle accidents are marked in the accident table. Dresden is found through the region dimension, so the query counts all 2024 bicycle accidents in the Dresden region. |

## 9. Municipalities in Saxony with zero accidents in 2023

| Item | Value |
| --- | --- |
| Answer | 7 municipalities |
| Schema used | `regions`, `accidents` |
| Query shape | `LEFT JOIN accidents` with `HAVING COUNT(a.accident_id) = 0` and `state.ags = '14'` |
| Data resource | GV-ISys + Unfallatlas |
| Explanation | This is a zero-case analysis. The query starts with the full municipality list from GV-ISys and left-joins accidents. Any municipality with no joined accident row in 2023 is a zero-case municipality. |

## Why this is reproducible

- answers come from normalized tables, not from fixed text;
- official region keys are stored in `regions.ags`;
- source files and ETL runs are stored in `source_files` and `import_runs`;
- cross-source answers show the source periods used.
